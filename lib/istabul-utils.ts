import fs from "fs";
import {glob} from "glob";
import {promisify} from "util";
import {createContext as createReportContext} from "istanbul-lib-report";
import {create as createReport, ReportOptions} from "istanbul-reports";
import {createCoverageMap} from "istanbul-lib-coverage";

const globAsync = promisify(glob);

export const generateMergedCoverageReports = async (coverageMapGlobs: string[], outputDir: string, reports: (keyof ReportOptions)[]) => {
  // Get the file paths from the globs.
  const coverageFiles = (await Promise.all(coverageMapGlobs.map((coverageMapGlob) => globAsync(coverageMapGlob))))
    .flatMap((pathsArr) => pathsArr);

  // Merge the coverage maps.
  const coverageMap = createCoverageMap({});
  (await Promise.all(coverageFiles.map((filePath) => fs.promises.readFile(filePath))))
    .map((fileContentBuffer) => JSON.parse(fileContentBuffer.toString()))
    .forEach((fileContent) => coverageMap.merge(fileContent));

  // Create report and output.
  const context = createReportContext({
    dir: outputDir,
    coverageMap,
  });

  reports.forEach((report) => createReport(report).execute(context));
};
