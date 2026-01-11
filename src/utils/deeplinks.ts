const ENV = process.env.APP_ENV || "development";

const apiMap = {
  development: {
    API: process.env.DEV_API,
    ALT_API: process.env.DEV_ALT_API,
    VOTER_API: process.env.DEV_VOTER_API,
  },
  uat: {
    API: process.env.UAT_API,
    ALT_API: process.env.UAT_ALT_API,
    VOTER_API: process.env.UAT_VOTER_API,
  },
  demo: {
    API: process.env.DEMO_API,
    ALT_API: process.env.DEMO_ALT_API,
    VOTER_API: process.env.DEMO_VOTER_API,
  },
  production: {
    API: process.env.PROD_API,
    ALT_API: process.env.PROD_ALT_API,
    VOTER_API: process.env.PROD_VOTER_API,
  },
};

const selected = apiMap[ENV] || apiMap.development;

const prefixes = [
  selected.API,
  selected.ALT_API,
  selected.VOTER_API,
  "abhiyanai://",
];

export default prefixes;