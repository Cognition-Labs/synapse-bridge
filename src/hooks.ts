import {
  BasicExampleFactory,
  HelperExampleFactory,
  KeyExampleFactory,
  PromptExampleFactory,
  UIExampleFactory,
} from "./modules/examples";
import { config } from "../package.json";
import { getString, initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();
  ztoolkit.ProgressWindow.setIconURI(
    "default",
    `chrome://${config.addonRef}/content/icons/favicon.png`
  );

  BasicExampleFactory.registerPrefs();
  BasicExampleFactory.registerNotifier();
  KeyExampleFactory.registerShortcuts();
  UIExampleFactory.registerStyleSheet();
  UIExampleFactory.registerRightClickMenuItem();
  UIExampleFactory.registerRightClickMenuPopup();
  UIExampleFactory.registerWindowMenuWithSeparator();
  await UIExampleFactory.registerExtraColumn();
  await UIExampleFactory.registerExtraColumnWithCustomCell();
  await UIExampleFactory.registerCustomCellRenderer();
  await UIExampleFactory.registerCustomItemBoxRow();
  UIExampleFactory.registerLibraryTabPanel();
  await UIExampleFactory.registerReaderTabPanel();
  PromptExampleFactory.registerNormalCommandExample();
  PromptExampleFactory.registerAnonymousCommandExample();
  PromptExampleFactory.registerConditionalCommandExample();

  const popupWin = new ztoolkit.ProgressWindow(config.addonName, {
    closeOnClick: true,
    closeTime: -1,
  })
    .createLine({
      text: getString("startup.begin"),
      type: "default",
      progress: 0,
    })
    .show();

  popupWin.addDescription("Your data is being synced...");
  popupWin.addDescription("testing 123...");

  await Zotero.Promise.delay(1000);
  popupWin.changeLine({
    progress: 30,
    text: `[30%] Syncing data...`,
  });

  const libraries = await Zotero.Libraries.getAll();
  let items: Zotero.Item[] = [];

  libraries.forEach(async (library) => {
    items = items.concat(
      await Zotero.Items.getAll(library.id, false, false, false)
    );
  });

  ztoolkit.log(items);

  for (let i = 0; i < 100; i++) {
    ztoolkit.log("--------------------");
  }

  const parentItems = items
    .filter((item) => item.isTopLevelItem())
    .map((item) => {
      return { ...item, children: [] };
    });

  const childItems = items.filter((item) => !item.isTopLevelItem());

  for (let i = 0; i < childItems.length; i++) {
    const parent = childItems[i].parentItem;
    if (parent) {
      const parentIndex = parentItems.findIndex(
        (item) => item.id == parent?.id
      );
      if (parentIndex > -1) {
        parentItems[parentIndex].children.push(childItems[i]);
      }
    }
  }

  ztoolkit.log(parentItems);

  await Zotero.Promise.delay(1000);

  popupWin.changeLine({
    progress: 100,
    text: `[100%] ${getString("startup.finish")}`,
  });

  popupWin.startCloseTimer(5000);

  addon.hooks.onDialogEvents("dialogExample");
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Notify events.
 * Any operations should be placed in a function to keep this funcion clear.
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any }
) {
  // You can add your code to the corresponding notify type
  ztoolkit.log("notify", event, type, ids, extraData);
  if (
    event == "select" &&
    type == "tab" &&
    extraData[ids[0]].type == "reader"
  ) {
    BasicExampleFactory.exampleNotifierCallback();
  } else {
    return;
  }
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

function onShortcuts(type: string) {
  switch (type) {
    case "larger":
      KeyExampleFactory.exampleShortcutLargerCallback();
      break;
    case "smaller":
      KeyExampleFactory.exampleShortcutSmallerCallback();
      break;
    case "confliction":
      KeyExampleFactory.exampleShortcutConflictingCallback();
      break;
    default:
      break;
  }
}

function onDialogEvents(type: string) {
  switch (type) {
    case "dialogExample":
      HelperExampleFactory.dialogExample();
      break;
    case "clipboardExample":
      HelperExampleFactory.clipboardExample();
      break;
    case "filePickerExample":
      HelperExampleFactory.filePickerExample();
      break;
    case "progressWindowExample":
      HelperExampleFactory.progressWindowExample();
      break;
    case "vtableExample":
      HelperExampleFactory.vtableExample();
      break;
    default:
      break;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onShutdown,
  onNotify,
  onPrefsEvent,
  onShortcuts,
  onDialogEvents,
};
