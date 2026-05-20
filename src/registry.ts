export interface RegistryWallet {
  name: string;
  icon: string;
  url: string;
}

// Inline base64 SVG icons — no network request, always available
const PHANTOM_ICON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgcng9IjIyIiBmaWxsPSIjQUI5RkYyIi8+PGVsbGlwc2UgY3g9IjY0IiBjeT0iNTIiIHJ4PSIzMCIgcnk9IjMwIiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjM0IiB5PSI1MiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0zNCA4OCBRNDQgMTAyIDU0IDg4IFE2MiAxMDIgNzAgODggUTc4IDEwMiA4OCA4OCBMOTQgODggTDk0IDk0IFE4NCAxMDggNzQgOTQgUTY2IDEwOCA1OCA5NCBRNTAgMTA4IDQwIDk0IFEzMCAxMDggMjggOTQgTDI4IDg4WiIgZmlsbD0id2hpdGUiLz48Y2lyY2xlIGN4PSI1MiIgY3k9IjQ3IiByPSI3IiBmaWxsPSIjQUI5RkYyIi8+PGNpcmNsZSBjeD0iNzYiIGN5PSI0NyIgcj0iNyIgZmlsbD0iI0FCOUZGMiIvPjwvc3ZnPg==";

const SOLFLARE_ICON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgcng9IjIyIiBmaWxsPSIjRkM3MjI3Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik02NCAyMiBMNzIgNTAgSDEwMCBMNzggNjYgTDg2IDk0IEw2NCA3OCBMNDIgOTQgTDUwIDY2IEwyOCA1MCBINTZaIi8+PC9zdmc+";

const BACKPACK_ICON =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij48cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgcng9IjIyIiBmaWxsPSIjRTMzRTNGIi8+PHJlY3QgeD0iNDIiIHk9IjQ2IiB3aWR0aD0iNDQiIGhlaWdodD0iNTIiIHJ4PSIxMCIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNNTIgNDYgUTUyIDMwIDY0IDMwIFE3NiAzMCA3NiA0NiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI4IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cmVjdCB4PSI1NCIgeT0iNjgiIHdpZHRoPSIyMCIgaGVpZ2h0PSIxNCIgcng9IjUiIGZpbGw9IiNFMzNFM0YiLz48L3N2Zz4=";

export const POPULAR_WALLETS: RegistryWallet[] = [
  {
    name: "Phantom",
    icon: PHANTOM_ICON,
    url: "https://phantom.app",
  },
  {
    name: "Solflare",
    icon: SOLFLARE_ICON,
    url: "https://solflare.com",
  },
  {
    name: "Backpack",
    icon: BACKPACK_ICON,
    url: "https://backpack.app",
  },
];
