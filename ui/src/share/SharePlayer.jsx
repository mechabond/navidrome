import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import PauseIcon from '@material-ui/icons/Pause'
import SkipNextIcon from '@material-ui/icons/SkipNext'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import ShuffleIcon from '@material-ui/icons/Shuffle'
import RepeatIcon from '@material-ui/icons/Repeat'
import RepeatOneIcon from '@material-ui/icons/RepeatOne'
import VolumeUpIcon from '@material-ui/icons/VolumeUp'
import VolumeDownIcon from '@material-ui/icons/VolumeDown'
import VolumeOffIcon from '@material-ui/icons/VolumeOff'
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward'
import ScheduleIcon from '@material-ui/icons/Schedule'
import config, { shareInfo } from '../config'
import { shareCoverUrl, shareDownloadUrl, shareStreamUrl } from '../utils'
import { formatTime, formatTotal } from './format'

// How long the download button stays inert after a click. The browser needs a
// moment to show its own download UI; until then the page looks unresponsive.
export const DOWNLOAD_FEEDBACK_MS = 5000

const VOLUME_KEY = 'drome-share-volume'

const c = {
  bg: '#121212',
  surface: '#181818',
  header: '#2e2e2e',
  rowHover: 'rgba(255, 255, 255, 0.07)',
  rowActive: 'rgba(255, 255, 255, 0.12)',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#ffffff',
  muted: '#a7a7a7',
  faint: '#6f6f6f',
  accent: '#1ed760',
  track: '#4d4d4d',
}

const rangeStyles = {
  WebkitAppearance: 'none',
  appearance: 'none',
  height: 4,
  borderRadius: 2,
  outline: 'none',
  cursor: 'pointer',
  margin: 0,
  background: 'transparent',
  '&::-webkit-slider-thumb': {
    WebkitAppearance: 'none',
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: c.text,
    border: 'none',
    opacity: 0,
    transition: 'opacity 0.1s',
  },
  '&::-moz-range-thumb': {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: c.text,
    border: 'none',
    opacity: 0,
  },
  '&:hover::-webkit-slider-thumb, &:focus-visible::-webkit-slider-thumb': {
    opacity: 1,
  },
  '&:hover::-moz-range-thumb, &:focus-visible::-moz-range-thumb': {
    opacity: 1,
  },
}

const useStyles = makeStyles(
  {
    '@global': {
      body: {
        margin: 0,
        background: c.bg,
      },
    },
    root: {
      minHeight: '100vh',
      background: c.bg,
      color: c.text,
      fontFamily:
        'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      paddingBottom: 112,
      '@media (max-width: 767px)': {
        paddingBottom: 150,
      },
      '& button': {
        fontFamily: 'inherit',
      },
    },
    header: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 24,
      padding: '64px 32px 24px',
      background: `linear-gradient(180deg, #3d3d3d 0%, ${c.header} 100%)`,
      '@media (max-width: 767px)': {
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '32px 16px 20px',
        gap: 16,
      },
    },
    cover: {
      width: 232,
      height: 232,
      flexShrink: 0,
      objectFit: 'cover',
      borderRadius: 4,
      background: '#282828',
      boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
      '@media (max-width: 767px)': {
        width: 200,
        height: 200,
      },
    },
    headerText: {
      minWidth: 0,
    },
    label: {
      fontSize: 14,
      fontWeight: 500,
      marginBottom: 8,
    },
    title: {
      margin: '0 0 12px',
      fontSize: 'clamp(2rem, 7vw, 5.5rem)',
      fontWeight: 900,
      lineHeight: 1,
      letterSpacing: '-0.04em',
      wordBreak: 'break-word',
    },
    description: {
      color: c.muted,
      fontSize: 14,
      margin: '0 0 8px',
    },
    meta: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      fontSize: 14,
      color: c.muted,
      '@media (max-width: 767px)': {
        justifyContent: 'center',
      },
    },
    owner: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: c.text,
      fontWeight: 700,
    },
    ownerAvatar: {
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: '#535353',
      color: c.text,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
    },
    body: {
      background: `linear-gradient(180deg, ${c.header} 0, ${c.bg} 240px)`,
      padding: '0 32px',
      '@media (max-width: 767px)': {
        padding: '0 8px',
      },
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      padding: '24px 0',
      '@media (max-width: 767px)': {
        padding: '16px 8px',
      },
    },
    bigPlay: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      border: 'none',
      background: c.accent,
      color: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'transform 0.1s, background 0.1s',
      '&:hover': {
        transform: 'scale(1.05)',
        background: '#3be477',
      },
      '& svg': {
        fontSize: 32,
      },
    },
    iconButton: {
      border: 'none',
      background: 'transparent',
      color: c.muted,
      padding: 4,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      borderRadius: '50%',
      position: 'relative',
      '&:hover:not(:disabled)': {
        color: c.text,
      },
      '&:disabled': {
        opacity: 0.35,
        cursor: 'default',
      },
    },
    iconActive: {
      color: c.accent,
      '&:hover:not(:disabled)': {
        color: '#3be477',
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -4,
        left: '50%',
        width: 4,
        height: 4,
        marginLeft: -2,
        borderRadius: '50%',
        background: c.accent,
      },
    },
    downloadButton: {
      width: 32,
      height: 32,
      border: `2px solid ${c.muted}`,
      '&:hover:not(:disabled)': {
        borderColor: c.text,
      },
      '& svg': {
        fontSize: 20,
      },
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'fixed',
      fontSize: 14,
    },
    th: {
      color: c.muted,
      fontWeight: 400,
      textAlign: 'left',
      padding: '8px 12px',
      borderBottom: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    },
    colNum: {
      width: 40,
      textAlign: 'right !important',
    },
    colAlbum: {
      width: '35%',
      '@media (max-width: 767px)': {
        display: 'none',
      },
    },
    colTime: {
      width: 64,
      textAlign: 'right !important',
    },
    spacerRow: {
      height: 8,
    },
    row: {
      cursor: 'pointer',
      '& td': {
        padding: '8px 12px',
        color: c.muted,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      '& td:first-child': {
        borderRadius: '4px 0 0 4px',
      },
      '& td:last-child': {
        borderRadius: '0 4px 4px 0',
      },
      '&:hover td': {
        background: c.rowHover,
      },
      '&:hover $numText': {
        display: 'none',
      },
      '&:hover $rowPlayIcon': {
        display: 'inline-flex',
      },
    },
    rowCurrent: {
      '& td': {
        background: c.rowActive,
      },
      '& $trackTitle, & $numText': {
        color: c.accent,
      },
    },
    numText: {
      fontVariantNumeric: 'tabular-nums',
    },
    rowPlayIcon: {
      display: 'none',
      color: c.text,
      verticalAlign: 'middle',
      '& svg': {
        fontSize: 18,
      },
    },
    titleCell: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
    },
    thumb: {
      width: 40,
      height: 40,
      flexShrink: 0,
      borderRadius: 4,
      objectFit: 'cover',
      background: '#282828',
    },
    titleText: {
      minWidth: 0,
      lineHeight: 1.35,
    },
    trackTitle: {
      color: c.text,
      fontSize: 16,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    trackArtist: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    empty: {
      color: c.muted,
      padding: '48px 0',
      textAlign: 'center',
    },
    bar: {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      height: 88,
      boxSizing: 'border-box',
      background: '#000',
      borderTop: `1px solid ${c.border}`,
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)',
      alignItems: 'center',
      gap: 16,
      padding: '0 16px',
      zIndex: 10,
      '@media (max-width: 767px)': {
        height: 'auto',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gridTemplateAreas: '"now volume" "controls controls"',
        rowGap: 4,
        padding: '10px 12px 12px',
      },
    },
    now: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
      '@media (max-width: 767px)': {
        gridArea: 'now',
      },
    },
    nowThumb: {
      width: 56,
      height: 56,
      borderRadius: 4,
      objectFit: 'cover',
      flexShrink: 0,
      background: '#282828',
      '@media (max-width: 767px)': {
        width: 44,
        height: 44,
      },
    },
    nowTitle: {
      fontSize: 14,
      color: c.text,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    nowArtist: {
      fontSize: 12,
      color: c.muted,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    center: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
      '@media (max-width: 767px)': {
        gridArea: 'controls',
      },
    },
    transport: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    },
    playPause: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      border: 'none',
      background: c.text,
      color: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'transform 0.1s',
      '&:hover': {
        transform: 'scale(1.06)',
      },
      '& svg': {
        fontSize: 22,
      },
    },
    progressRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      maxWidth: 640,
      fontSize: 12,
      color: c.muted,
      fontVariantNumeric: 'tabular-nums',
      '& span': {
        minWidth: 36,
      },
      '& span:first-child': {
        textAlign: 'right',
      },
    },
    range: {
      ...rangeStyles,
      flex: 1,
      minWidth: 0,
    },
    volume: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      '@media (max-width: 767px)': {
        gridArea: 'volume',
      },
    },
    volumeRange: {
      ...rangeStyles,
      width: 110,
      '@media (max-width: 767px)': {
        width: 80,
      },
    },
  },
  { name: 'DromeShare' },
)

const typeLabel = (type) => {
  switch (type) {
    case 'playlist':
      return 'Public Playlist'
    case 'album':
      return 'Album'
    case 'artist':
      return 'Artist'
    default:
      return 'Shared Songs'
  }
}

const shuffled = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const readVolume = () => {
  try {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8
  } catch {
    return 0.8
  }
}

const rangeFill = (fraction, color) => {
  const pct = Math.min(100, Math.max(0, fraction * 100))
  return {
    background: `linear-gradient(to right, ${color} ${pct}%, ${c.track} ${pct}%)`,
  }
}

const SharePlayer = () => {
  const classes = useStyles()
  const tracks = useMemo(() => shareInfo?.tracks || [], [])
  const audioRef = useRef(null)
  const timer = useRef(null)

  const [current, setCurrent] = useState(null) // index into tracks
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(null)
  const [volume, setVolume] = useState(readVolume)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off') // off | all | one
  const [order, setOrder] = useState(() => tracks.map((_, i) => i))
  const [downloading, setDownloading] = useState(false)
  const [progressHover, setProgressHover] = useState(false)
  const [volumeHover, setVolumeHover] = useState(false)

  const name = shareInfo?.name || shareInfo?.description || 'Shared playlist'
  const showDescription =
    shareInfo?.description && shareInfo.description !== name
  const coverUrl =
    shareInfo?.imageUrl ||
    (tracks.length > 0 ? shareCoverUrl(tracks[0].id, true) : undefined)
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
  const canDownload = shareInfo?.downloadable && config.enableDownloads
  const track = current !== null ? tracks[current] : null

  useEffect(() => () => clearTimeout(timer.current), [])

  // Keep the audio element's volume in sync and remember it for next visit.
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = volume
      audio.muted = muted
    }
    try {
      localStorage.setItem(VOLUME_KEY, String(volume))
    } catch {
      // Storage can be unavailable (private mode); volume just won't persist.
    }
  }, [volume, muted])

  const playIndex = useCallback(
    (index) => {
      const audio = audioRef.current
      if (!audio || index === null || !tracks[index]) return
      if (index !== current) {
        audio.src = shareStreamUrl(tracks[index].id)
        setCurrent(index)
        setTime(0)
        setDuration(tracks[index].duration || 0)
      }
      const p = audio.play()
      if (p && p.catch) p.catch(() => setPlaying(false))
    },
    [current, tracks],
  )

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (current === null) {
      playIndex(order[0] ?? 0)
    } else if (audio.paused) {
      const p = audio.play()
      if (p && p.catch) p.catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }, [current, order, playIndex])

  const step = useCallback(
    (dir, fromEnded = false) => {
      if (tracks.length === 0) return
      const pos = current === null ? -1 : order.indexOf(current)
      let next = pos + dir
      if (next >= order.length) {
        if (repeat === 'all' || !fromEnded) next = 0
        else {
          setPlaying(false)
          return
        }
      }
      if (next < 0) next = order.length - 1
      playIndex(order[next])
    },
    [current, order, playIndex, repeat, tracks.length],
  )

  const previous = useCallback(() => {
    const audio = audioRef.current
    // Like most players: restart the song unless we're right at its start.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    step(-1)
  }, [step])

  const onEnded = useCallback(() => {
    if (repeat === 'one') {
      const audio = audioRef.current
      audio.currentTime = 0
      audio.play()
      return
    }
    step(1, true)
  }, [repeat, step])

  const toggleShuffle = () => {
    const all = tracks.map((_, i) => i)
    if (shuffle) {
      setOrder(all)
    } else {
      // Keep the current song first so shuffling doesn't jump away from it.
      const rest = shuffled(all.filter((i) => i !== current))
      setOrder(current === null ? rest : [current, ...rest])
    }
    setShuffle(!shuffle)
  }

  const cycleRepeat = () =>
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'))

  const playAll = () => {
    if (current !== null) togglePlay()
    else playIndex(order[0] ?? 0)
  }

  const commitSeek = () => {
    if (seeking !== null && audioRef.current) {
      audioRef.current.currentTime = seeking
      setTime(seeking)
    }
    setSeeking(null)
  }

  const onVolumeChange = (e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (v > 0 && muted) setMuted(false)
  }

  // An anchor, not a navigation: the service worker's NavigationRoute would
  // intercept the streamed archive and fail it.
  const download = useCallback(() => {
    const link = document.createElement('a')
    link.href = shareDownloadUrl(shareInfo?.id)
    link.download = ''
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setDownloading(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(
      () => setDownloading(false),
      DOWNLOAD_FEEDBACK_MS,
    )
  }, [])

  // Space bar toggles playback, unless the user is typing or on a control.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return
      const tag = e.target?.tagName
      if (['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(tag)) return
      e.preventDefault()
      togglePlay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay])

  // Lock-screen / media-key controls.
  useEffect(() => {
    const ms = typeof navigator !== 'undefined' && navigator.mediaSession
    if (!ms || !track) return
    try {
      if (typeof window.MediaMetadata === 'function') {
        ms.metadata = new window.MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album,
          artwork: [{ src: shareCoverUrl(track.id, true), sizes: '300x300' }],
        })
      }
      ms.setActionHandler('play', togglePlay)
      ms.setActionHandler('pause', togglePlay)
      ms.setActionHandler('nexttrack', () => step(1))
      ms.setActionHandler('previoustrack', previous)
    } catch {
      // Some browsers support only part of the API.
    }
  }, [track, togglePlay, step, previous])

  const shownTime = seeking !== null ? seeking : time
  const effectiveVolume = muted ? 0 : volume
  const VolumeIcon =
    effectiveVolume === 0
      ? VolumeOffIcon
      : effectiveVolume < 0.5
        ? VolumeDownIcon
        : VolumeUpIcon
  const multi = tracks.length > 1

  return (
    <div className={classes.root}>
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) {
            setDuration(e.currentTarget.duration)
          }
        }}
        onEnded={onEnded}
      />

      <header className={classes.header}>
        {coverUrl && <img className={classes.cover} src={coverUrl} alt="" />}
        <div className={classes.headerText}>
          <div className={classes.label}>
            {typeLabel(shareInfo?.resourceType)}
          </div>
          <h1 className={classes.title}>{name}</h1>
          {showDescription && (
            <p className={classes.description}>{shareInfo.description}</p>
          )}
          <div className={classes.meta}>
            {shareInfo?.owner && (
              <>
                <span className={classes.owner}>
                  <span className={classes.ownerAvatar} aria-hidden="true">
                    {shareInfo.owner.charAt(0)}
                  </span>
                  {shareInfo.owner}
                </span>
                <span aria-hidden="true">•</span>
              </>
            )}
            <span>
              {tracks.length} {tracks.length === 1 ? 'song' : 'songs'},{' '}
              {formatTotal(totalDuration)}
            </span>
          </div>
        </div>
      </header>

      <main className={classes.body}>
        <div className={classes.actions}>
          <button
            type="button"
            className={classes.bigPlay}
            onClick={playAll}
            disabled={tracks.length === 0}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <PauseIcon /> : <PlayArrowIcon />}
          </button>
          {multi && (
            <button
              type="button"
              className={`${classes.iconButton} ${shuffle ? classes.iconActive : ''}`}
              onClick={toggleShuffle}
              aria-label="Shuffle"
              aria-pressed={shuffle}
              title="Shuffle"
            >
              <ShuffleIcon style={{ fontSize: 30 }} />
            </button>
          )}
          {canDownload && (
            <button
              type="button"
              className={`${classes.iconButton} ${classes.downloadButton}`}
              onClick={download}
              disabled={downloading}
              aria-label="Download"
              title="Download"
            >
              <ArrowDownwardIcon />
            </button>
          )}
        </div>

        {tracks.length === 0 ? (
          <div className={classes.empty}>This share has no songs.</div>
        ) : (
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={`${classes.th} ${classes.colNum}`}>#</th>
                <th className={classes.th}>Title</th>
                <th className={`${classes.th} ${classes.colAlbum}`}>Album</th>
                <th className={`${classes.th} ${classes.colTime}`}>
                  <ScheduleIcon
                    style={{ fontSize: 18, verticalAlign: 'middle' }}
                    aria-label="Duration"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className={classes.spacerRow} aria-hidden="true" />
              {tracks.map((t, i) => {
                const isCurrent = i === current
                return (
                  <tr
                    key={t.id}
                    className={`${classes.row} ${isCurrent ? classes.rowCurrent : ''}`}
                    onClick={() => (isCurrent ? togglePlay() : playIndex(i))}
                    data-testid="track-row"
                  >
                    <td className={classes.colNum}>
                      <span className={classes.numText}>
                        {isCurrent && playing ? '▶' : i + 1}
                      </span>
                      <span className={classes.rowPlayIcon}>
                        {isCurrent && playing ? (
                          <PauseIcon />
                        ) : (
                          <PlayArrowIcon />
                        )}
                      </span>
                    </td>
                    <td>
                      <div className={classes.titleCell}>
                        <img
                          className={classes.thumb}
                          src={shareCoverUrl(t.id, true)}
                          alt=""
                          loading="lazy"
                        />
                        <div className={classes.titleText}>
                          <div className={classes.trackTitle}>{t.title}</div>
                          <div className={classes.trackArtist}>{t.artist}</div>
                        </div>
                      </div>
                    </td>
                    <td className={classes.colAlbum}>{t.album}</td>
                    <td className={classes.colTime}>
                      {formatTime(t.duration)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </main>

      <footer className={classes.bar}>
        <div className={classes.now}>
          {track && (
            <>
              <img
                className={classes.nowThumb}
                src={shareCoverUrl(track.id, true)}
                alt=""
              />
              <div style={{ minWidth: 0 }}>
                <div className={classes.nowTitle}>{track.title}</div>
                <div className={classes.nowArtist}>{track.artist}</div>
              </div>
            </>
          )}
        </div>

        <div className={classes.center}>
          <div className={classes.transport}>
            <button
              type="button"
              className={`${classes.iconButton} ${shuffle ? classes.iconActive : ''}`}
              onClick={toggleShuffle}
              disabled={!multi}
              aria-label="Shuffle"
              aria-pressed={shuffle}
              title="Shuffle"
            >
              <ShuffleIcon fontSize="small" />
            </button>
            <button
              type="button"
              className={classes.iconButton}
              onClick={previous}
              disabled={tracks.length === 0}
              aria-label="Previous"
              title="Previous"
            >
              <SkipPreviousIcon />
            </button>
            <button
              type="button"
              className={classes.playPause}
              onClick={togglePlay}
              disabled={tracks.length === 0}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <PauseIcon /> : <PlayArrowIcon />}
            </button>
            <button
              type="button"
              className={classes.iconButton}
              onClick={() => step(1)}
              disabled={!multi}
              aria-label="Next"
              title="Next"
            >
              <SkipNextIcon />
            </button>
            <button
              type="button"
              className={`${classes.iconButton} ${repeat !== 'off' ? classes.iconActive : ''}`}
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeat}`}
              title={`Repeat: ${repeat}`}
            >
              {repeat === 'one' ? (
                <RepeatOneIcon fontSize="small" />
              ) : (
                <RepeatIcon fontSize="small" />
              )}
            </button>
          </div>
          <div className={classes.progressRow}>
            <span>{formatTime(shownTime)}</span>
            <input
              type="range"
              className={classes.range}
              min={0}
              max={duration || 0}
              step="any"
              value={Math.min(shownTime, duration || 0)}
              disabled={!track}
              onChange={(e) => setSeeking(parseFloat(e.target.value))}
              onMouseUp={commitSeek}
              onTouchEnd={commitSeek}
              onKeyUp={commitSeek}
              onMouseEnter={() => setProgressHover(true)}
              onMouseLeave={() => setProgressHover(false)}
              style={rangeFill(
                duration ? shownTime / duration : 0,
                progressHover ? c.accent : c.text,
              )}
              aria-label="Seek"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className={classes.volume}>
          <button
            type="button"
            className={classes.iconButton}
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon fontSize="small" />
          </button>
          <input
            type="range"
            className={classes.volumeRange}
            min={0}
            max={1}
            step={0.01}
            value={effectiveVolume}
            onChange={onVolumeChange}
            onMouseEnter={() => setVolumeHover(true)}
            onMouseLeave={() => setVolumeHover(false)}
            style={rangeFill(effectiveVolume, volumeHover ? c.accent : c.text)}
            aria-label="Volume"
          />
        </div>
      </footer>
    </div>
  )
}

export default SharePlayer
