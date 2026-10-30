const navigate = (path: string) => {
  (window as any).__navigation = path;
};
const router = {
  push: navigate,
  replace: navigate,
  refresh: () => {},
  back: () => {},
};
export function useRouter() {
  return router;
}
export function usePathname() {
  return (window as any).__pathname ?? "/";
}
export function useSearchParams() {
  return new URLSearchParams();
}
