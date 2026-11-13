import { useEffect, useState } from "react";
import { installMusic, onMusicChange, toggleMusic } from "../lib/music";

/** Floating music button: animated bars while playing, tap to stop or play again. */
export default function MusicToggle() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    installMusic();
    const off = onMusicChange(setPlaying);
    return () => { off(); };
  }, []);

  return (
    <button
      type="button"
      className={`music-toggle${playing ? " is-playing" : ""}`}
      onClick={(e) => { e.stopPropagation(); toggleMusic(); }}
      aria-pressed={playing}
      aria-label={playing ? "Stop the music" : "Play the music"}
      title={playing ? "Stop the music" : "Play the music"}
    >
      <span className="mt-bars" aria-hidden="true"><i /><i /><i /><i /></span>
      <svg className="mt-note" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 17.5a3 3 0 1 1-2-2.83V5l11-2v11.5a3 3 0 1 1-2-2.83V7.4l-7 1.3z" />
      </svg>
    </button>
  );
}
