import { cp,mkdir,rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const check=spawnSync(process.execPath,["scripts/check.mjs"],{stdio:"inherit"});
if(check.status!==0) process.exit(check.status??1);
await rm("dist",{recursive:true,force:true});await mkdir("dist",{recursive:true});
await Promise.all([cp("index.html","dist/index.html"),cp("robots.txt","dist/robots.txt"),cp("assets","dist/assets",{recursive:true})]);
console.log("Built static Vercel output in dist/.");
