import { createContext, useContext, useEffect, useState, ReactNode, FC } from "react";

type Platform = "ios" | "android" | "desktop";
type SizeX = "compact" | "regular";
type SizeY = "compact" | "regular";

interface AdaptivityContextType {
  platform: Platform;
  sizeX: SizeX;
  sizeY: SizeY;
  viewportWidth: number;
  viewportHeight: number;
  isTouch: boolean;
}

const AdaptivityContext = createContext<AdaptivityContextType>({
  platform: "desktop",
  sizeX: "regular",
  sizeY: "regular",
  viewportWidth: 0,
  viewportHeight: 0,
  isTouch: false,
});

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
};

const getSizeX = (width: number): SizeX => {
  return width < 600 ? "compact" : "regular";
};

const getSizeY = (height: number): SizeY => {
  return height < 600 ? "compact" : "regular";
};

interface AdaptivityProviderProps {
  children: ReactNode;
}

export const AdaptivityProvider: FC<AdaptivityProviderProps> = ({ children }) => {
  const getViewportSize = () => {
    const viewport = window.visualViewport;
    const width = viewport?.width ?? window.innerWidth;
    const height = viewport?.height ?? window.innerHeight;
    return { width, height };
  };

  const [state, setState] = useState<AdaptivityContextType>(() => ({
    platform: detectPlatform(),
    sizeX: getSizeX(getViewportSize().width),
    sizeY: getSizeY(getViewportSize().height),
    viewportWidth: getViewportSize().width,
    viewportHeight: getViewportSize().height,
    isTouch: "ontouchstart" in window,
  }));

  useEffect(() => {
    const handleResize = () => {
      const { width, height } = getViewportSize();
      setState((prev) => ({
        ...prev,
        sizeX: getSizeX(width),
        sizeY: getSizeY(height),
        viewportWidth: width,
        viewportHeight: height,
      }));
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, []);

  return (
    <AdaptivityContext.Provider value={state}>
      {children}
    </AdaptivityContext.Provider>
  );
};

export const useAdaptivity = () => useContext(AdaptivityContext);
