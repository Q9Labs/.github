# LEAP production deployment

Run the complete production release from the repository root:

```sh
./leap/deploy
```

The command builds the static website, deploys the claimed Lakebed capsule, stages the website over SSH, swaps the Hostinger release, and verifies the exact live revision. The prior Hostinger release remains at `domains/q9labs.ai/.deploy-previous` for rollback.

Email delivery is opt-in because it creates a real lead and sends the confirmation and internal notification emails:

```sh
./leap/deploy --test-email hasan@q9labs.ai
```

Use a dry run to compile the website and verify the Hostinger transfer without changing production:

```sh
./leap/deploy --dry-run
```

The script uses the existing `~/.ssh/hostinger_websites_ed25519` key and the claimed Lakebed deployment. These environment variables override the Hostinger defaults when the account moves:

- `Q9_WEBSITE_DIR` (optional source checkout/worktree; defaults to `website/`)
- `Q9_HOSTINGER_HOST`
- `Q9_HOSTINGER_PORT`
- `Q9_HOSTINGER_USER`
- `Q9_HOSTINGER_KEY`
- `Q9_HOSTINGER_ROOT`

If a live website smoke check fails after the swap, the script restores `.deploy-previous` automatically. A successful deployment keeps that directory as the manual rollback point. Run `./leap/deploy --rollback` to restore it without rebuilding or redeploying the capsule.
