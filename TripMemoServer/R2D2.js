import { deleteFromR2 } from "./r2.js";


const deletedCount = await deleteFromR2("canvas/64/");
console.log("Deleted:", deletedCount);