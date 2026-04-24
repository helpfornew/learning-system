#!/usr/bin/env node
/**
 * 错题数据库迁移脚本
 * 添加 user_id 字段，支持账号数据隔离
 */

const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DATA_FILE = path.join(__dirname, '.data', 'mistakes.db');

async function migrateDatabase() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   错题数据库迁移工具                      ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 检查数据库文件
  if (!fs.existsSync(DATA_FILE)) {
    console.log('❌ 数据库文件不存在:', DATA_FILE);
    console.log('提示：请先运行 server.js 创建数据库');
    return;
  }

  try {
    const SQL = await initSqlJs();
    const data = fs.readFileSync(DATA_FILE);
    const db = new SQL.Database(data);

    // 检查表结构
    console.log('📋 检查表结构...');
    const result = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='mistakes'");

    if (result.length === 0) {
      console.log('❌ mistakes 表不存在');
      db.close();
      return;
    }

    const createSql = result[0].values[0][0];
    console.log('当前表结构:\n', createSql);

    // 检查是否已有 user_id 字段
    if (createSql.includes('user_id')) {
      console.log('\n✅ 数据库已包含 user_id 字段，无需迁移');
      db.close();
      return;
    }

    console.log('\n🔧 开始迁移...');

    // 添加 user_id 字段
    console.log('1. 添加 user_id 字段...');
    db.run('ALTER TABLE mistakes ADD COLUMN user_id INTEGER DEFAULT 1');
    console.log('   ✅ 字段添加成功');

    // 保存数据库
    console.log('2. 保存数据库...');
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const dbData = db.export();
    const buffer = Buffer.from(dbData);
    fs.writeFileSync(DATA_FILE, buffer);
    console.log('   ✅ 数据库已保存');

    db.close();

    // 验证迁移结果
    console.log('\n3. 验证迁移结果...');
    const verifyData = fs.readFileSync(DATA_FILE);
    const verifyDb = new SQL.Database(verifyData);
    const verifyResult = verifyDb.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='mistakes'");

    if (verifyResult.length > 0 && verifyResult[0].values[0][0].includes('user_id')) {
      console.log('   ✅ 迁移成功验证通过');

      // 统计数据
      const countResult = verifyDb.exec('SELECT COUNT(*) FROM mistakes');
      const recordCount = countResult[0].values[0][0];
      console.log(`   📊 当前错题总数：${recordCount}`);

      // 显示前 3 条记录
      const sampleResult = verifyDb.exec('SELECT id, user_id, subject_id, content FROM mistakes LIMIT 3');
      if (sampleResult.length > 0 && sampleResult[0].values.length > 0) {
        console.log('\n   示例数据：');
        sampleResult[0].values.forEach((row, i) => {
          console.log(`   - 错题 #${row[0]}: user_id=${row[1]}, subject_id=${row[2]}`);
        });
      }
    } else {
      console.log('   ❌ 验证失败，请检查数据库文件');
    }

    verifyDb.close();

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   迁移完成！                              ║');
    console.log('║   所有现有数据的 user_id = 1               ║');
    console.log('╚══════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行迁移
migrateDatabase();
