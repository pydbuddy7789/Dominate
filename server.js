const express=require("express"),session=require("express-session"),bcrypt=require("bcryptjs"),DB=require("better-sqlite3"),path=require("path");
const app=express(),db=new DB(path.join(__dirname,"ranking.db"));
db.exec(`CREATE TABLE IF NOT EXISTS items(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,value REAL NOT NULL DEFAULT 0,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE,password_hash TEXT NOT NULL);`);
if(!db.prepare("SELECT id FROM admins WHERE username=?").get("admin"))db.prepare("INSERT INTO admins(username,password_hash) VALUES(?,?)").run("admin",bcrypt.hashSync("aubook05052026",10));
if(!db.prepare("SELECT COUNT(*) c FROM items").get().c){let i=db.prepare("INSERT INTO items(name,value) VALUES(?,?)");[["PLAYER ONE",980],["PLAYER TWO",875],["PLAYER THREE",790],["PLAYER FOUR",650],["PLAYER FIVE",520]].forEach(x=>i.run(...x))}
app.use(express.json());app.use(express.urlencoded({extended:false}));app.use(session({secret:process.env.SESSION_SECRET||"dominate-ranking-change-me",resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax"}}));app.use(express.static(path.join(__dirname,"public")));
const auth=(q,r,n)=>q.session.adminId?n():r.status(401).json({error:"Unauthorized"});
app.get("/api/ranking",(q,r)=>r.json(db.prepare("SELECT * FROM items ORDER BY value DESC,id ASC").all()));
app.get("/api/me",(q,r)=>r.json({loggedIn:!!q.session.adminId}));
app.post("/api/login",(q,r)=>{let u=db.prepare("SELECT * FROM admins WHERE username=?").get(q.body.username);if(!u||!bcrypt.compareSync(q.body.password||"",u.password_hash))return r.status(401).json({error:"ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"});q.session.adminId=u.id;r.json({ok:true})});
app.post("/api/logout",auth,(q,r)=>q.session.destroy(()=>r.json({ok:true})));
app.post("/api/items",auth,(q,r)=>{let {name,value}=q.body;if(!name||Number.isNaN(Number(value)))return r.status(400).json({error:"ข้อมูลไม่ถูกต้อง"});r.json({id:db.prepare("INSERT INTO items(name,value) VALUES(?,?)").run(name.trim(),Number(value)).lastInsertRowid})});
app.put("/api/items/:id",auth,(q,r)=>{let {name,value}=q.body;if(!name||Number.isNaN(Number(value)))return r.status(400).json({error:"ข้อมูลไม่ถูกต้อง"});db.prepare("UPDATE items SET name=?,value=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(name.trim(),Number(value),q.params.id);r.json({ok:true})});
app.delete("/api/items/:id",auth,(q,r)=>{db.prepare("DELETE FROM items WHERE id=?").run(q.params.id);r.json({ok:true})});
app.listen(process.env.PORT||3000,()=>console.log("Dominate Ranking running"));
