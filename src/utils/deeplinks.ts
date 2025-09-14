
const ENV = process.env.APP_ENV || "development";

const prefixes =
  ENV === "production"
    ? [
        "http://3.6.255.8:5000",
        "http://3.6.255.8:5002",
        "abhiyanai://",
      ]
    : [
        "http://localhost:5201",
        "http://localhost:5202",
        "abhiyanai://",
      ];

export default prefixes;