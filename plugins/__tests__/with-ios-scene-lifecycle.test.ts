const { updateAppDelegate } = require('../with-ios-scene-lifecycle');

const generatedAppDelegate = `import Expo
import React

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
}
`;

describe('with-ios-scene-lifecycle', () => {
  it('moves React Native startup into a scene delegate', () => {
    const result = updateAppDelegate(generatedAppDelegate);

    expect(result).toContain(
      'var reactNativeLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?',
    );
    expect(result).toContain('reactNativeLaunchOptions = launchOptions');
    expect(result).toContain('@objc(SceneDelegate)');
    expect(result).toContain('UIWindow(windowScene: windowScene)');
    expect(result).not.toContain('UIWindow(frame: UIScreen.main.bounds)');
  });

  it('is idempotent', () => {
    const once = updateAppDelegate(generatedAppDelegate);

    expect(updateAppDelegate(once)).toBe(once);
    expect(once.match(/@objc\(SceneDelegate\)/g)).toHaveLength(1);
  });
});
