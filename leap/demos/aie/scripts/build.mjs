import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root=fileURLToPath(new URL('../public/',import.meta.url));
const files=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())await walk(path);else if(!['release.json','sw.js'].includes(entry.name))files.push(path);}}
await walk(root);
const hash=createHash('sha256');
for(const file of files.sort()){
  if(file.endsWith('.js'))execFileSync(process.execPath,['--check',file]);
  hash.update(relative(root,file));hash.update(await readFile(file));
}
const release={revision:hash.digest('hex').slice(0,16),builtAt:new Date().toISOString(),products:['ava','nura','edli','chalk','track','flow','mesa','terminal']};
await writeFile(join(root,'release.json'),JSON.stringify(release,null,2)+'\n');
const assets=files.map(file=>'/'+relative(root,file)).filter(path=>path!=='/_headers');
const template=await readFile(new URL('./sw-template.js',import.meta.url),'utf8');
await writeFile(join(root,'sw.js'),template.replace('__CACHE_VERSION__',release.revision).replace('__ASSETS__',JSON.stringify(assets)));
console.log(`Validated ${files.length} static files. Release ${release.revision}`);
