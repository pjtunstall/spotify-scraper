export default function getCurrency(country, text) {
  switch (country) {
    case "Argentina":
      return "ARS";

    case "Australia":
    case "Nauru":
    case "Kiribati":
    case "Tuvalu":
      return "AUD";

    case "Bangladesh":
      return "BDT";

    case "Belarus":
    case "Georgia":
    case "Jordan":
    case "Kazakhstan":
    case "Kuwait":
    case "Kyrgyzstan":
    case "Marshall Islands":
    case "Moldova":
    case "Oman":
    case "Tajikistan":
    case "United States":
    case "Ukraine":
    case "Uzbekistan":
    case "Zambia":
      return "USD";

    case "Brazil":
      return "BRL";
    case "Bulgaria":
      return "BGN";
    case "Canada":
      return "CAD";
    case "Chile":
      return "CLP";
    case "Colombia":
      return "COP";
    case "Czechia":
      return "CZK";
    case "Denmark":
      return "DKK";
    case "Egypt":
      return "EGP";
    case "Ghana":
      return "GHS";
    case "Hong Kong":
      return "HKD";
    case "Hungary":
      return "HUF";
    case "Iraq":
      return "IQD";
    case "Israel":
      return "ILS";
    case "India":
      return "INR";
    case "Indonesia":
      return "IDR";
    case "Japan":
      return "JPY";
    case "Kenya":
      return "KES";
    case "Korea":
      return "KRW";
    case "Liechtenstein":
      return "CHF";
    case "Malaysia":
      return "MYR";
    case "Mexico":
      return "MXN";
    case "Morocco":
      return "MAD";
    case "New Zealand":
      return "NZD";
    case "Nigeria":
      return "NGN";
    case "Norway":
      return "NOK";
    case "Pakistan":
      return "PKR";
    case "Peru":
      return "PEN";
    case "Philippines":
      return "PHP";
    case "Poland":
      return "PLN";
    case "Qatar":
      return "QAR";
    case "Romania":
      return "RON";
    case "Saudi Arabia":
      return "SAR";
    case "Singapore":
      return "SGD";
    case "South Africa":
      return "ZAR";
    case "South Korea":
      return "KRW";
    case "Sri Lanka":
      return "LKR";
    case "Sweden":
      return "SEK";
    case "Switzerland":
      return "CHF";
    case "Taiwan":
      return "TWD";
    case "Tanzania":
      return "TZS";
    case "Thailand":
      return "THB";
    case "Tunisia":
      return "TND";
    case "Turkey":
      return "TRY";
    case "Uganda":
      return "UGX";
    case "United Arab Emirates":
      return "AED";
    case "United Kingdom":
      return "GBP";
    case "Vietnam":
      return "VND";

    default:
      if (/US\$|\$US/.test(text)) {
        return "USD";
      } else if (/€/.test(text)) {
        return "EUR";
      } else if (/£/.test(text)) {
        return "GBP";
      }
      return "";
  }
}
