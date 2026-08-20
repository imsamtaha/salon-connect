import "dotenv/config";

import { seedIfEmpty } from "../server/seed";

seedIfEmpty()
  .then((result) => {
    console.log("Database seed:", result);
    console.log("Manager: nadine@justbeauty.local / demo1234");
    console.log("Customer: nora@justbeauty.local / demo1234");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
