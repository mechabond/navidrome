import { render, act, fireEvent, screen } from '@testing-library/react'
import SharePlayer, { DOWNLOAD_FEEDBACK_MS } from './SharePlayer'
import { formatTotal } from './format'

vi.mock('../config', () => ({
  default: { enableDownloads: true },
  shareInfo: {
    id: 'share-1',
    name: 'Lionel',
    description: '',
    resourceType: 'playlist',
    owner: 'mim',
    imageUrl: '/share/img/cover',
    downloadable: true,
    tracks: [
      { id: 't1', title: 'One', artist: 'A', album: 'X', duration: 100 },
      { id: 't2', title: 'Two', artist: 'B', album: 'Y', duration: 200 },
    ],
  },
}))

vi.mock('../utils', () => ({
  shareDownloadUrl: (id) => `/share/d/${id}`,
  shareStreamUrl: (id) => `/share/s/${id}`,
  shareCoverUrl: (id) => `/share/img/${id}`,
}))

describe('SharePlayer', () => {
  let clickSpy
  let playSpy

  beforeEach(() => {
    vi.useFakeTimers()
    // Downloading for real would navigate the jsdom window.
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    // jsdom does not implement media playback.
    playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    localStorage.clear()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows the playlist header', () => {
    render(<SharePlayer />)
    expect(screen.getByRole('heading', { name: 'Lionel' })).toBeTruthy()
    expect(screen.getByText('Public Playlist')).toBeTruthy()
    expect(screen.getByText('mim')).toBeTruthy()
    expect(screen.getByText('2 songs, 5 min 0 sec')).toBeTruthy()
    expect(screen.getAllByTestId('track-row')).toHaveLength(2)
  })

  it('plays a track when its row is clicked', () => {
    const { container } = render(<SharePlayer />)
    fireEvent.click(screen.getAllByTestId('track-row')[1])
    const audio = container.querySelector('audio')
    expect(audio.src).toContain('/share/s/t2')
    expect(playSpy).toHaveBeenCalled()
  })

  it('has a volume control that sets and remembers the volume', () => {
    const { container } = render(<SharePlayer />)
    const slider = screen.getByLabelText('Volume')
    fireEvent.change(slider, { target: { value: '0.3' } })
    expect(container.querySelector('audio').volume).toBeCloseTo(0.3)
    expect(localStorage.getItem('drome-share-volume')).toBe('0.3')
  })

  it('mutes and unmutes', () => {
    const { container } = render(<SharePlayer />)
    const audio = container.querySelector('audio')
    fireEvent.click(screen.getByLabelText('Mute'))
    expect(audio.muted).toBe(true)
    fireEvent.click(screen.getByLabelText('Unmute'))
    expect(audio.muted).toBe(false)
  })

  it('downloads via an anchor so the service worker does not intercept it', () => {
    render(<SharePlayer />)

    let anchor
    clickSpy.mockImplementation(function () {
      anchor = { href: this.href, download: this.download }
    })

    fireEvent.click(screen.getByLabelText('Download'))

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(anchor.href).toContain('/share/d/share-1')
    // Empty, so the server's Content-Disposition filename wins.
    expect(anchor.download).toBe('')
    expect(document.querySelectorAll('a[download]')).toHaveLength(0)
  })

  it('keeps the download button inert for the feedback window', () => {
    render(<SharePlayer />)
    const button = screen.getByLabelText('Download')

    fireEvent.click(button)
    expect(button.disabled).toBe(true)

    act(() => {
      vi.advanceTimersByTime(DOWNLOAD_FEEDBACK_MS + 1)
    })
    expect(button.disabled).toBe(false)
  })

  it('does not update state after unmount', () => {
    const { unmount } = render(<SharePlayer />)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    fireEvent.click(screen.getByLabelText('Download'))
    unmount()
    act(() => {
      vi.runAllTimers()
    })

    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('formats total durations like Spotify', () => {
    expect(formatTotal(3186)).toBe('53 min 6 sec')
    expect(formatTotal(3900)).toBe('1 hr 5 min')
  })
})
