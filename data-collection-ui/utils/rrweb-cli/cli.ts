#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import minimist from "minimist";
import { ProgressBar } from "@opentf/cli-pbar";
import type Player from "rrweb-player";
import { transformToVideo } from "./index";

const argv = minimist(process.argv.slice(2));

if (!argv.input) {
  throw new Error("please pass --input to your rrweb events file");
}

let config = {};

if (argv.config) {
  const configPathStr = argv.config as string;
  const configPath = path.isAbsolute(configPathStr)
    ? configPathStr
    : path.resolve(process.cwd(), configPathStr);
  config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as Omit<
    ConstructorParameters<typeof Player>[0]["props"],
    "events"
  >;
}

const pBar = new ProgressBar({ prefix: "Transforming" });
const onProgressUpdate = (percent: number) => {
  if (percent < 1) pBar.start({ value: percent * 100, total: 100 });
  else if (percent >= 1) pBar.stop("Done!");
  else pBar.update({ value: percent * 100, total: 100 });
};

transformToVideo({
  input: argv.input as string,
  output: argv.output as string,
  rrwebPlayer: config,
  onProgressUpdate,
})
  .then((file) => {
    console.log(`Successfully transformed into "${file}".`);
  })
  .catch((error) => {
    console.log("Failed to transform this session.");
    console.error(error);
    process.exit(1);
  });
