/// <reference types="chrome"/>
import { useRef, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Replayer from 'rrweb-player';
import { getEvents, getSession } from '~/utils/storage';

export default function Player() {
  const playerElRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Replayer | null>(null);
  const { sessionId } = useParams();
  const [sessionName, setSessionName] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    getSession(sessionId)
      .then((session) => {
        setSessionName(session.name);
      })
      .catch((err) => {
        console.error(err);
      });
    getEvents(sessionId)
      .then((events) => {
        if (!playerElRef.current) return;
        if (playerRef.current) return;

        const manifest = chrome.runtime.getManifest();
        const screenTrailPlayerVersion = manifest.version_name || manifest.version;
        const linkEl = document.createElement('link');
        linkEl.href = `https://cdn.jsdelivr.net/npm/rrweb-player@${screenTrailPlayerVersion}/dist/style.min.css`;
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
        playerRef.current = new Replayer({
          target: playerElRef.current as HTMLElement,
          props: {
            events,
            autoPlay: true,
          },
        });
      })
      .catch((err) => {
        console.error(err);
      });
    return () => {
      // eslint-disable-next-line
      playerRef.current?.pause();
      // eslint-disable-next-line
      if (playerRef.current && 'destroy' in playerRef.current) {
        // @ts-ignore - The rrweb-player type definitions are incomplete
        playerRef.current.$destroy();
      }
    };
  }, [sessionId]);

  return (
    <div className="p-4">
      <nav className="flex mb-5 text-md">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="text-blue-500 hover:underline">
              Sessions
            </Link>
          </li>
          <li className="flex items-center">
            <span className="mx-2 text-gray-400">/</span>
            <span>{sessionName}</span>
          </li>
        </ol>
      </nav>
      <div className="flex justify-center">
        <div ref={playerElRef}></div>
      </div>
    </div>
  );
}
