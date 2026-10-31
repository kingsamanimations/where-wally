import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";

const app = express();
app.use(cors({ 
    origin: (origin, cb) => { 
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
        cb(null, process.env.CLIENT_URL === origin);
    },
 }));
app.use(express.json());

// Start a game and send names WITHOUT coordinates
app.post("/games", async (req, res) => {
    const game = await prisma.game.create({ data: {startedAt: new Date()} });
    const characters = await prisma.character.findMany({
        select: { id: true, name: true },
        orderBy: { id: "asc" },
    });
    res.json({ gameId: game.id, characters });
});

// Validate guess
app.post("/games/:id/guess", async (req, res) => {
    const { characterId, x, y } = req.body;

    const id = Number(characterId);
    if (!Number.isInteger(id) || typeof x !== "number" || typeof y !== "number") {
        return res.status(400).json({ error: "Invalid guess"});
    }
    const game = await prisma.game.findUnique({ where: { id: req.params.id} });
    if (!game) return res.status(404).json({ error: "Game not found" });
    if (game.finishedAt) return res.status(400).json({ error: "Game already finished" });

    const character = await prisma.character.findUnique({ where: { id: Number(characterId) } });
    if (!character) return res.json({ correct: false });

    await prisma.found.upsert({
        where: { gameId_characterId: { gameId: game.id, characterId: character.id}},
        update: {},
        create: { gameId: game.id, characterId: character.id },
    });

    const [foundCount, total] = await Promise.all([
        prisma.found.count({ where: { gameId: game.id } }),
        prisma.character.count(),
    ]);

    let finished = false, timeMs = null;
    if (foundCount === total) {
        const finishedAt = new Date();
        timeMs = finishedAt - game.startedAt;
        await prisma.game.update({ where: { id: game.id }, data: (finishedAt, timeMs)});
        finished = true;
    }

    // Return position so client can place a marker
    res.json({ correct: true, x: character.x, y: character.y, finished, timeMs});
});

// Submit name for high score
app.post("/games/:id/score", async (req, res) => {
    const name = String(req.body.name || "").trim().slice(0, 20);
    if (!name) return res.status(400).json({ error: "Name is required"});
    const game = await prisma.game.findUnique({ where: { id: req.params.id }});
    if (!game?.finishedAt) return res.status(400).json({ error: "Games is not finished"});
    await prisma.game.update({ where: { id: game.id }, data: { playerName: name }});
    res.json({ ok: true });
});

app.get("/scores", async (req, res) => {
    const scores = await prisma.game.findMany({
        where: { playerName: { not: null }},
        orderBy: { timeMs: "asc"},
        take: 10,
        select: { playerName: true, timeMs: true},
    });
    res.json(scores);
});

const port = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Where's Wally API is running"));
app.listen(port, () => console.log(`API on http://localhost:${port}`));