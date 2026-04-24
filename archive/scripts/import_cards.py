#!/usr/bin/env python3
import json,sqlite3
conn=sqlite3.connect('/opt/learning-system/database/unified_learning.db')
cur=conn.cursor()
with open('/home/user/wordcard-system/cards.json') as f:data=json.load(f)
words=data.get('vocabulary',[])
print(f'Loaded {len(words)} words')
uid,imp,skip=1,0,0
for w in words:
 try:
  cur.execute('SELECT id FROM vocabulary WHERE user_id=? AND word=?',(uid,w.lower()))
  if cur.fetchone():skip+=1;continue
  cur.execute("INSERT INTO vocabulary (user_id,word,status,熟练度，review_count) VALUES (?,'new',0,0)",(uid,w.lower()))
  imp+=1
 except:skip+=1
conn.commit();conn.close()
print(f'Done:{imp} imported,{skip} skipped')
