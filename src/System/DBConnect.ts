import knex from "knex";
import { dbIndex } from "../Config/MainConfig";

export const db = knex(dbIndex);

