import { normalizePath, TFile, WorkspaceLeaf } from "obsidian";

import {
  formatJalali,
  JalaliPeriod,
  startOfJalaliPeriod,
  toJalali,
} from "src/jalali/dates";
import { parseJalaliFormat } from "src/jalali/parse";
import { getJalaliNoteConfig, ISettings, JALALI_PERIODS } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

import { applyJalaliTemplate } from "./template";

const PERIOD_TITLES: Record<JalaliPeriod, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
  quarter: "Quarterly",
  year: "Yearly",
};

/** Vault path of the note for `date`, e.g. `Daily/1405-08-08.md`. */
export function getJalaliNotePath(
  settings: ISettings,
  period: JalaliPeriod,
  date: Date
): string {
  const { format, folder } = getJalaliNoteConfig(settings, period);
  const filename = formatJalali(startOfJalaliPeriod(date, period), format);
  return normalizePath(`${folder}/${filename}.md`);
}

export function getJalaliNote(
  settings: ISettings,
  period: JalaliPeriod,
  date: Date
): TFile | null {
  const file = window.app.vault.getAbstractFileByPath(
    getJalaliNotePath(settings, period, date)
  );
  return file instanceof TFile ? file : null;
}

// Gregorian years (2026) read as Jalali years would be centuries in the future.
const MAX_PLAUSIBLE_JALALI_YEAR = 1800;

/**
 * The date a file is a Jalali note for, or null. The name must parse with a
 * note format *and* sit at the path the plugin would create it at.
 */
export function findJalaliDateForFile(
  settings: ISettings,
  file: TFile
): Date | null {
  for (const { period } of JALALI_PERIODS) {
    const { format } = getJalaliNoteConfig(settings, period);
    const date = parseJalaliFormat(file.basename, format);
    if (
      date &&
      toJalali(date).year <= MAX_PLAUSIBLE_JALALI_YEAR &&
      getJalaliNotePath(settings, period, date) === file.path
    ) {
      return date;
    }
  }
  return null;
}

async function ensureFolderExists(path: string): Promise<void> {
  const dirs = path.split("/");
  dirs.pop();
  if (dirs.length) {
    const dir = dirs.join("/");
    if (!window.app.vault.getAbstractFileByPath(dir)) {
      await window.app.vault.createFolder(dir);
    }
  }
}

async function readTemplate(template: string, period: JalaliPeriod) {
  if (!template.trim()) {
    return "";
  }
  const { metadataCache, vault } = window.app;
  try {
    const templateFile = metadataCache.getFirstLinkpathDest(
      normalizePath(template),
      ""
    );
    return await vault.cachedRead(templateFile);
  } catch (err) {
    console.error(`Failed to read the ${period} note template '${template}'`, err);
    return "";
  }
}

export async function createJalaliNote(
  settings: ISettings,
  period: JalaliPeriod,
  date: Date
): Promise<TFile> {
  const { format, template } = getJalaliNoteConfig(settings, period);
  const start = startOfJalaliPeriod(date, period);
  const path = getJalaliNotePath(settings, period, date);
  const filename = formatJalali(start, format);

  const contents = applyJalaliTemplate(await readTemplate(template, period), {
    date: start,
    format,
    filename,
    time: window.moment().format("HH:mm"),
  });

  await ensureFolderExists(path);
  return window.app.vault.create(path, contents);
}

function getTargetLeaf(
  settings: ISettings,
  ctrlPressed: boolean
): WorkspaceLeaf {
  const { workspace } = window.app;
  if (!ctrlPressed) {
    return workspace.getLeaf(false);
  }
  return settings.ctrlClickOpensInNewTab
    ? workspace.getLeaf("tab")
    : workspace.getLeaf("split", "vertical");
}

/**
 * Open the Jalali note for `date`, creating it first (after a confirmation,
 * if enabled in settings) when it doesn't exist yet.
 */
export async function openOrCreateJalaliNote(
  settings: ISettings,
  period: JalaliPeriod,
  date: Date,
  ctrlPressed: boolean,
  onOpened?: (file: TFile) => void
): Promise<void> {
  const existing = getJalaliNote(settings, period, date);
  if (existing) {
    await getTargetLeaf(settings, ctrlPressed).openFile(existing);
    onOpened?.(existing);
    return;
  }

  const createAndOpen = async () => {
    const file = await createJalaliNote(settings, period, date);
    await getTargetLeaf(settings, ctrlPressed).openFile(file, { active: true });
    onOpened?.(file);
  };

  if (settings.shouldConfirmBeforeCreate) {
    const { format } = getJalaliNoteConfig(settings, period);
    const filename = formatJalali(startOfJalaliPeriod(date, period), format);
    createConfirmationDialog({
      cta: "Create",
      onAccept: createAndOpen,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: `New ${PERIOD_TITLES[period]} Note`,
    });
  } else {
    await createAndOpen();
  }
}
