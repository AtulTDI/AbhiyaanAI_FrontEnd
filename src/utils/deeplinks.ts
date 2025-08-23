
const ENV = process.env.APP_ENV || "development";

const prefixes =
  ENV === "production"
    ? [
        "http://13.51.244.195:5000",
        "abhiyanai://",
      ]
    : [
        "http://localhost:5201",
        "http://localhost:5202",
        "abhiyanai://",
      ];

export default prefixes;