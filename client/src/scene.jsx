import { useState, useRef, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

const CHARACTERS = ["Wally", "Wenda", "Odlaw"]; //hardcoded for now

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${m}:${String(s).padStart(2, "0")}.${tenths}`;
}


export default function Scene() {
    const startRef = useRef(null);
    const imgRef = useRef(null);
    const wrapperRef = useRef(null);
    const [pick, setPick] = useState(null); // { x, y } as 0-1 fractions, or null

    const [game, setGame] = useState(null);
    const [foundIds, setFoundIds] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [message, setMessage] = useState("");
    const [elapsed, setElapsed] = useState(0);
    const [finalTime, setFinalTime] = useState(null);
    const [error, setError] = useState("");


    // Start a game on load
    useEffect(() => {
        let cancelled = false;
        fetch(`${API}/games`, { method: "POST"})
            .then((r) => r.json())
            .then((data) => {
                if (cancelled) return;
                startRef.current = Date.now();
                setGame(data);
            })
            .catch((err) => {
                console.log(err);
                setError("Could not reach the server. ");
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Display timer
    useEffect(() => {
        if (!game || finalTime !== null) return;
        const id = setInterval(() => setElapsed(Date.now() - startRef.current), 100);
        return () => clearInterval(id);
    }, [game, finalTime]);

    // Close target box when clicking outside image
    useEffect(() => {
        function handleDocClick(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setPick(null);
            }
        }
        document.addEventListener("click", handleDocClick);
        return () => document.removeEventListener("click", handleDocClick);
    }, []);


    // Image clicker
    function handleImageClick(e) {
        if (!game || finalTime !== null) return;
        const rect = imgRef.current.getBoundingClientRect();
        setPick({ 
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
        });
        console.log((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height,);
    }

    function flash(text) {
        setMessage(text);
        setTimeout(() => setMessage(""), 1800);
    }

    // Selecting characters on image
    async function handleSelect(character) {
        const { x, y } = pick;
        setPick(null);
        try {
            const res = await fetch(`${API}/games/${game.gameId}/guess`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ characterId: character.id, x, y}),
            });
            const data = await res.json();
            if (data.correct) {
                setFoundIds((ids) => [...ids, character.id]);
                setMarkers((m) => [...m, { id: character.id, name: character.name, x: data.x, y: data.y}]);
                flash(`Well done! You found ${character.name}!`);
                if (data.finished) setFinalTime(data.timeMs);
            } else {
                flash("Not there, try again!");
            }
        } catch {
            flash("Sorry, Network error. This demo only allows Wally and Wenda to be found.");
        }
    }

    if (error) return <p className="status">{error}</p>
    if (!game) return <p className="status">Loading...</p>

    // Displaying the scene
    return (
        <>
            <header className="hud">
                <div className="hud-chars">
                    {game.characters.map((c) => (
                        <span key={c.id} className={foundIds.includes(c.id) ? "found" : ""}>
                            {c.name}
                        </span>
                    ))}
                </div>
                <div className="hud-timer">{formatTime(finalTime ?? elapsed)}</div>
            </header>

            {message && <div className="toast">{message}</div>}
            <div className="scene" ref={wrapperRef}>
                <img ref={imgRef} src="/Wally.avif" alt="Where's Wally Scene" onClick={handleImageClick} />

                {markers.map((m) => (
                    <div key={m.id} className="marker" style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`}}
                    title={m.name}
                    />
                ))}

                {pick && (
                    <div className="target" style={{ left: `${pick.x * 100}%`, top: `${pick.y * 100}%`}}>
                        <div className="target-box" />
                        <ul className="target-menu">
                            {game.characters.map((c) => (
                                <li key={c.id}>
                                    <button disabled={foundIds.includes(c.id)} onClick={() => handleSelect(c)}>{c.name}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {finalTime !== null && <WinModal gameId={game.gameId} timeMs={finalTime} />}
        </>
    );
}

// Winner - Loading scores
function WinModal({ gameId, timeMs }) {
    const [name, setName] = useState("");
    const [scores, setScores] = useState(null);
    const [error, setError] = useState("");

    async function loadScores() {
        const res = await fetch(`${API}/scores`);
        setScores(await res.json());
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const res = await fetch(`${API}/games/${gameId}/score`, {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) return setError("Could not save your score");
        await loadScores();
    }

    // Winner and High Score Reveal
    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h2>Great job! You found them all!</h2>
                <p>Your time: <strong>{formatTime(timeMs)}</strong></p>

                {scores === null ? (
                    <form onSubmit={handleSubmit}>
                        <label>
                            Enter your name for the high scores:
                            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} required />
                        </label>
                        <button type="submit">Submit</button>
                        <button type="button" onClick={loadScores}>Skip</button>
                        {error && <p className="error">{error}</p>}
                    </form>
                ) : (
                    <>
                        <h3>High Scores</h3>
                        <ol>
                            {scores.map((s, i) => (
                                <li key={i}>{s.playerName}: {formatTime(s.timeMs)}</li>
                            ))}
                        </ol>
                        <button onClick={() => window.location.reload()}>Play again</button>
                    </>
                )}
            </div>
        </div>
    );
}