import express from "express"

const app = express()
const PORT = 3000

app.use(express.json())

app.get("/", (_,res)=>{
  res.json({message: "Server running"})
})

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});