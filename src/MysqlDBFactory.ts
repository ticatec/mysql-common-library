import {DBConnection, DBFactory} from '@ticatec/node-common-library';
import mysql, {Pool, PoolConnection} from "mysql2/promise";
import Field, {FieldType} from "@ticatec/node-common-library/lib/db/Field";

class MysqlDBConnection extends DBConnection {

    #client: PoolConnection;

    constructor(conn: PoolConnection) {
        super();
        this.#client = conn;
    }

    async beginTransaction(): Promise<void> {
        await this.#client.beginTransaction();
        return
    }

    async close(): Promise<void> {
        await this.#client.release();
    }

    async commit(): Promise<void> {
        await this.#client.commit();
    }

    async rollback(): Promise<void> {
        try {
            await this.#client.rollback();
        } catch (e) {
            this.logger.error('Cannot rollback the database.\n' + e);
        }
    }

    async executeUpdate(sql: string, params:Array<any>): Promise<number> {
        let result = await this.#client.execute(sql, params);
        return this.getAffectRows(result);
    }

    getFields(result: any): Array<Field>{
        const fields = result.fields;
        const list:Array<Field> = [];
        fields.forEach(field => {
            list.push({ name: this.toCamel(field.name), type: FieldType.Text });
        });
        return list;
    }

    getRowSet(result: any): Array<any> {
        return result.rows;
    }

    getAffectRows(result): number {
        return result.affectedRows;
    }

    protected buildFieldsMap(fields: Array<any>): Map<string, string> {
        let map: Map<string, string> = new Map<string, string>();
        fields.forEach(field => {
            map.set(field.name, this.toCamel(field.name.toLowerCase()));
        })
        return map;
    }

    protected getFirstRow(result: any): any {
        if (result.rows.length > 0) {
            let ds = {};
            result.fields.forEach(field => {
                this.setNestObj(ds, field.name.toLowerCase(), result.rows[0][field.name]);
            });
            return ds;
        } else {
            return null;
        }
    }

    async fetchData(sql: string, params: Array<any> | void): Promise<any> {
        let [rows, fields] = await this.#client.execute(sql, params);
        return {rows, fields};
    }

    protected async executeSQL(sql: string): Promise<any> {
        return await this.#client.execute(sql);
    }
    insertRecord(sql: string, params: Array<any>): Promise<any> {
        return this.executeUpdate(sql, params);
    }
    updateRecord(sql: string, params: Array<any>): Promise<number> {
        return this.executeUpdate(sql, params);
    }
    deleteRecord(sql: string, params: Array<any>): Promise<number> {
        return this.executeUpdate(sql, params);
    }

}

class MysqlDBFactory implements DBFactory {

    #pool: Pool;

    constructor(pool: Pool) {
        this.#pool = pool;
    }

    async createDBConnection(): Promise<DBConnection> {
        return new MysqlDBConnection(await this.#pool.getConnection());
    }

}


export const initializeMySQL = (config):DBFactory => {
    return new MysqlDBFactory( mysql.createPool(config));
}

