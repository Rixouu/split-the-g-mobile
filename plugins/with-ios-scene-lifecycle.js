const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const LEGACY_STARTUP_BLOCK = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif`;

const SCENE_DELEGATE = `@objc(SceneDelegate)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else {
      return
    }

    var launchOptions = appDelegate.reactNativeLaunchOptions ?? [:]

    if let urlContext = connectionOptions.urlContexts.first {
      launchOptions[.url] = urlContext.url
      launchOptions[.sourceApplication] = urlContext.options.sourceApplication
      launchOptions[.annotation] = urlContext.options.annotation
    }

    if let userActivity = connectionOptions.userActivities.first {
      launchOptions[.userActivityDictionary] = [
        UIApplication.LaunchOptionsKey.userActivityType.rawValue: userActivity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": userActivity,
      ]
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
      return
    }

    for context in URLContexts {
      var options: [UIApplication.OpenURLOptionsKey: Any] = [
        .openInPlace: context.options.openInPlace,
      ]
      if let sourceApplication = context.options.sourceApplication {
        options[.sourceApplication] = sourceApplication
      }
      if let annotation = context.options.annotation {
        options[.annotation] = annotation
      }
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: options)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
      return
    }

    _ = appDelegate.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in })
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    (UIApplication.shared.delegate as? AppDelegate)?.applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    (UIApplication.shared.delegate as? AppDelegate)?.applicationWillResignActive(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    (UIApplication.shared.delegate as? AppDelegate)?.applicationDidEnterBackground(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    (UIApplication.shared.delegate as? AppDelegate)?.applicationWillEnterForeground(UIApplication.shared)
  }
}`;

function updateAppDelegate(source) {
  if (!source.includes('var reactNativeLaunchOptions:')) {
    source = source.replace(
      '  var reactNativeFactory: RCTReactNativeFactory?',
      '  var reactNativeFactory: RCTReactNativeFactory?\n  var reactNativeLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?',
    );
  }

  if (!source.includes('reactNativeLaunchOptions = launchOptions')) {
    source = source.replace(
      '    reactNativeFactory = factory\n    bindReactNativeFactory(factory)',
      '    reactNativeFactory = factory\n    reactNativeLaunchOptions = launchOptions\n    bindReactNativeFactory(factory)',
    );
  }

  source = source.replace(`\n${LEGACY_STARTUP_BLOCK}\n`, '\n');

  if (!source.includes('@objc(SceneDelegate)')) {
    const delegateAnchor = '\nclass ReactNativeDelegate: ExpoReactNativeFactoryDelegate {';
    if (!source.includes(delegateAnchor)) {
      throw new Error('Could not find ReactNativeDelegate in the generated iOS AppDelegate.');
    }
    source = source.replace(delegateAnchor, `\n${SCENE_DELEGATE}\n${delegateAnchor}`);
  }

  return source;
}

module.exports = function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return mod;
  });

  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') {
      throw new Error('The iOS scene lifecycle plugin requires a Swift AppDelegate.');
    }
    mod.modResults.contents = updateAppDelegate(mod.modResults.contents);
    return mod;
  });
};

module.exports.updateAppDelegate = updateAppDelegate;
