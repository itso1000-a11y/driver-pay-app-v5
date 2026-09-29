declare module "react" {
  namespace React {
    const StrictMode: any;
    type ReactNode = any;
    type CSSProperties = any;
    type SetStateAction<S> = S | ((prevState: S) => S);
    type Dispatch<A> = (value: A) => void;
    type RefObject<T> = { current: T | null };
    class Component<P = any, S = any> {
      props: P;
      state: S;
      constructor(props: P);
      setState(state: Partial<S> | ((prevState: S, props: P) => Partial<S> | S | null)): void;
      render(): ReactNode;
    }
  }
  const React: {
    Component: typeof React.Component;
    StrictMode: any;
    createElement: (...args: any[]) => any;
  };
  export default React;
  export const useState: <S>(initialState: S | (() => S)) => [S, React.Dispatch<React.SetStateAction<S>>];
  export const useEffect: (effect: () => void | (() => void), deps?: any[]) => void;
  export const useMemo: <T>(factory: () => T, deps?: any[]) => T;
  export const useRef: <T>(initialValue: T) => React.RefObject<T>;
}

declare module "react-dom/client" {
  export function createRoot(container: Element | DocumentFragment): { render(children: any): void };
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicAttributes { key?: any; }
  interface IntrinsicElements { [elemName: string]: any; }
}
