import {DBConnection, DBFactory} from '@ticatec/node-common-library';
import mysql, {Pool, PoolConnection} from "mysql2/promise";
import Field, {FieldType} from "@ticatec/node-common-library/lib/db/Field";

/**
 * MySQL数据库连接实现类，继承自DBConnection
 */
class MysqlDBConnection extends DBConnection {

    #client: PoolConnection;

    /**
     * 构造函数
     * @param conn MySQL连接池连接对象
     */
    constructor(conn: PoolConnection) {
        super();
        this.#client = conn;
    }

    /**
     * 开始数据库事务
     * @returns Promise<void>
     */
    async beginTransaction(): Promise<void> {
        await this.#client.beginTransaction();
        return
    }

    /**
     * 关闭数据库连接，释放连接回连接池
     * @returns Promise<void>
     */
    async close(): Promise<void> {
        this.#client.release();
    }

    /**
     * 提交当前事务
     * @returns Promise<void>
     */
    async commit(): Promise<void> {
        await this.#client.commit();
    }

    /**
     * 回滚当前事务
     * @returns Promise<void>
     */
    async rollback(): Promise<void> {
        try {
            await this.#client.rollback();
        } catch (e) {
            this.logger.error('Cannot rollback the database.\n' + e);
        }
    }

    /**
     * 执行更新SQL语句
     * @param sql SQL语句
     * @param params 参数数组
     * @returns Promise<number> 受影响的行数
     */
    async executeUpdate(sql: string, params:Array<any>): Promise<number> {
        this.logger.debug(sql, params);
        let result = await this.#client.execute(sql, params);
        return this.getAffectRows(result);
    }

    /**
     * 从查询结果中提取字段信息
     * @param result 查询结果对象
     * @returns Array<Field> 字段数组
     */
    getFields(result: any): Array<Field>{
        const fields = result.fields;
        const list:Array<Field> = [];
        fields.forEach(field => {
            list.push({ name: this.toCamel(field.name), type: FieldType.Text });
        });
        return list;
    }

    /**
     * 从查询结果中提取行数据
     * @param result 查询结果对象
     * @returns Array<any> 行数据数组
     */
    getRowSet(result: any): Array<any> {
        return result.rows;
    }

    /**
     * 获取受影响的行数
     * @param result 查询结果对象
     * @returns number 受影响的行数
     */
    getAffectRows(result: any): number {
        return result.affectedRows;
    }

    /**
     * 构建字段名映射表
     * @param fields 字段数组
     * @returns Map<string, string> 字段名映射表
     */
    protected buildFieldsMap(fields: Array<any>): Map<string, string> {
        let map: Map<string, string> = new Map<string, string>();
        fields.forEach(field => {
            map.set(field.name, this.toCamel(field.name.toLowerCase()));
        })
        return map;
    }

    /**
     * 获取查询结果的第一行数据
     * @param result 查询结果对象
     * @returns any 第一行数据对象或null
     */
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

    /**
     * 执行查询SQL并获取数据
     * @param sql SQL查询语句
     * @param params 查询参数数组或undefined
     * @returns Promise<any> 包含rows和fields的结果对象
     */
    async fetchData(sql: string, params: Array<any> | void): Promise<any> {
        this.logger.debug(sql, params);
        let [rows, fields] = await this.#client.execute(sql, params);
        return {rows, fields};
    }

    /**
     * 执行SQL语句
     * @param sql SQL语句
     * @returns Promise<any> 执行结果
     */
    protected async executeSQL(sql: string): Promise<any> {
        return this.#client.execute(sql);
    }
    
    /**
     * 插入记录
     * @param sql 插入SQL语句
     * @param params 参数数组
     * @returns Promise<any> 插入结果的第一行数据
     */
    async insertRecord(sql: string, params: Array<any>): Promise<any> {
        this.logger.debug(sql, params);
        let result = await this.#client.execute(sql, params);
        return this.getFirstRow(result);
    }
    
    /**
     * 更新记录
     * @param sql 更新SQL语句
     * @param params 参数数组
     * @returns Promise<any> 更新结果的第一行数据
     */
    async updateRecord(sql: string, params: Array<any>): Promise<any> {
        this.logger.debug(sql, params);
        let result = await this.#client.execute(sql, params);
        return this.getFirstRow(result);
    }
    
    /**
     * 删除记录
     * @param sql 删除SQL语句
     * @param params 参数数组
     * @returns Promise<number> 受影响的行数
     */
    deleteRecord(sql: string, params: Array<any>): Promise<number> {
        return this.executeUpdate(sql, params);
    }

}

/**
 * MySQL数据库工厂类，实现DBFactory接口
 */
class MysqlDBFactory implements DBFactory {

    #pool: Pool;

    /**
     * 构造函数
     * @param pool MySQL连接池对象
     */
    constructor(pool: Pool) {
        this.#pool = pool;
    }

    /**
     * 创建数据库连接实例
     * @returns Promise<DBConnection> 数据库连接实例
     */
    async createDBConnection(): Promise<DBConnection> {
        return new MysqlDBConnection(await this.#pool.getConnection());
    }

}

/**
 * 初始化MySQL数据库工厂
 * @param config MySQL连接配置对象
 * @returns DBFactory MySQL数据库工厂实例
 */
export const initializeMySQL = (config: any):DBFactory => {
    return new MysqlDBFactory( mysql.createPool(config));
}

