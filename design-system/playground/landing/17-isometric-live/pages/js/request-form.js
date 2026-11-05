/* Q9 Labs demo request form. Sends the same request, fields, checks and analytics events as the Next.js RequestForm it replaces. */
(function () {
  var form = document.querySelector('form.form');
  if (!form) return;

  var SITE_KEY = '6Ldw89srAAAAAATnr0Yvv8YBKLmlo0cEUHEM0yjx';
  var EMAILJS = { url: 'https://api.emailjs.com/api/v1.0/email/send', service: 'service_pyjk30a', template: 'template_i15wcdq', key: 'hynYyM-sZPo2nIIkH' };
  var EVENT_BASE = { form_name: 'website_request', campaign: 'website', audience: 'buyer' };
  var EMAIL = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
  var PHONE = /^[+0-9()\-\s]{7,}$/;
  var FIELDS = ['full_name', 'business_email', 'phone_whatsapp', 'city', 'product_interest'];

  var token = null;
  var started = false;
  var submitted = false;
  var sending = false;
  var chosen = [];
  var widget;
  var button = form.querySelector('button[type=submit]');
  var label = button.querySelector('.btn-label');
  var alertBox = document.getElementById('form-alert');
  var sent = form.querySelector('.sent');

  function track(name, props, googleName) {
    var h = location.hostname;
    if (h !== 'q9labs.ai' && h !== 'www.q9labs.ai') return;
    var p = Object.assign({}, EVENT_BASE, props);
    try { if (window.posthog) window.posthog.capture(name, p); } catch (e) { console.error('PostHog could not capture ' + name + ':', e); }
    try { if (window.gtag) window.gtag('event', googleName || name, p); } catch (e) { console.error('Google Analytics could not capture ' + name + ':', e); }
  }

  function read() {
    var v = {};
    ['full_name', 'business_email', 'phone_whatsapp', 'city'].forEach(function (n) { v[n] = form.elements[n].value; });
    v.product_interest = chosen.slice();
    return v;
  }

  function validate(v) {
    var e = {};
    if (v.full_name.length < 4) e.full_name = 'Name is required';
    if (!EMAIL.test(v.business_email)) e.business_email = 'Enter a valid email address';
    if (v.phone_whatsapp.length < 7) e.phone_whatsapp = 'Enter a valid phone/WhatsApp number';
    else if (!PHONE.test(v.phone_whatsapp)) e.phone_whatsapp = 'Use numbers and + ( ) - only';
    if (v.product_interest.length < 1) e.product_interest = 'Please select at least one product';
    if (v.city.length < 1) e.city = 'Please select a city';
    return e;
  }

  function show(name, message) {
    var box = document.getElementById(name + '-error');
    box.textContent = message || '';
    box.hidden = !message;
    var target = name === 'product_interest' ? form.querySelector('fieldset') : form.elements[name];
    target.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) target.setAttribute('aria-describedby', name + '-error'); else target.removeAttribute('aria-describedby');
  }

  function setAlert(message) {
    alertBox.textContent = message;
    alertBox.hidden = !message;
  }

  function loadCaptcha() {
    if (loadCaptcha.done) return;
    loadCaptcha.done = true;
    window.q9CaptchaReady = function () {
      widget = window.grecaptcha.render('captcha', {
        sitekey: SITE_KEY,
        callback: function (t) { token = t; setAlert(''); },
        'expired-callback': function () { token = null; }
      });
    };
    var s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?onload=q9CaptchaReady&render=explicit';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  if (location.hash === '#form' || !('IntersectionObserver' in window)) {
    loadCaptcha();
  } else {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { loadCaptcha(); io.disconnect(); }
    }, { rootMargin: '900px' });
    io.observe(form);
  }

  form.addEventListener('focusin', function () {
    loadCaptcha();
    if (started) return;
    started = true;
    track('lead_form_started', {});
  });

  form.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.name !== 'product_interest') return;
    chosen = chosen.filter(function (x) { return x !== t.value; });
    if (t.checked) chosen.push(t.value);
    if (submitted) show('product_interest', validate(read()).product_interest);
  });

  form.addEventListener('input', function (ev) {
    if (!submitted || FIELDS.indexOf(ev.target.name) < 0 || ev.target.name === 'product_interest') return;
    show(ev.target.name, validate(read())[ev.target.name]);
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) return;
    submitted = true;
    var v = read();
    var errors = validate(v);
    FIELDS.forEach(function (n) { show(n, errors[n]); });
    var invalid = FIELDS.filter(function (n) { return errors[n]; });
    if (invalid.length) {
      track('lead_form_validation_failed', { invalid_field_count: invalid.length });
      var first = invalid[0] === 'product_interest' ? form.querySelector('input[name=product_interest]') : form.elements[invalid[0]];
      first.focus();
      return;
    }
    if (!token) {
      track('lead_form_submission_blocked', { block_reason: 'captcha_required' });
      setAlert('Please verify that you are not a robot.');
      return;
    }
    setAlert('');
    sending = true;
    button.disabled = true;
    label.textContent = 'Sending...';
    fetch(EMAILJS.url, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({
        lib_version: '4.4.1',
        user_id: EMAILJS.key,
        service_id: EMAILJS.service,
        template_id: EMAILJS.template,
        template_params: {
          full_name: v.full_name,
          business_email: v.business_email,
          phone_whatsapp: v.phone_whatsapp,
          city: v.city,
          product_interest: v.product_interest.join(', '),
          'g-recaptcha-response': token
        }
      })
    }).then(function (res) {
      if (!res.ok) throw new Error('EmailJS responded with ' + res.status);
      track('lead_form_submitted', { product_interest: v.product_interest.join(','), product_count: v.product_interest.length }, 'generate_lead');
      form.reset();
      chosen = [];
      form.classList.add('is-sent');
      sent.hidden = false;
      sent.focus();
    }).catch(function (err) {
      track('lead_form_submission_failed', { failure_reason: 'email_delivery' });
      setAlert('We could not send your request. Please try again or email q9labs.ai@gmail.com.');
      console.error('Email error:', err);
      // a reCAPTCHA token works once, so a retry needs a fresh one
      token = null;
      if (window.grecaptcha) window.grecaptcha.reset(widget);
    }).then(function () {
      sending = false;
      button.disabled = false;
      label.textContent = 'Send request';
    });
  });
})();
