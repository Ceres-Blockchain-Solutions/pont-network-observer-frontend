import { IntlShape } from "react-intl";

export function formatAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function numberFormat(
  intl: IntlShape,
  price: number | string,
  notation:
    | "standard"
    | "scientific"
    | "engineering"
    | "compact"
    | undefined = "standard",
  decimals = 2
) {
  if (price !== null) {
    const priceNumber = typeof price === "string" ? Number(price) : price;

    return intl.formatNumber(priceNumber, {
      maximumFractionDigits: decimals,
      notation,
    });
  }

  return "0.00";
}
