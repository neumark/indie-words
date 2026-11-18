// Root component — immediately.run renders the default export of THIS file.
// The static copy lives here; the lists and the two canvas charts are drawn by
// mountPage() once the markup exists.
import { useEffect, useRef } from 'react';
import './index.css';
import { mountPage } from './lib/page';

function App() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => (root.current ? mountPage(root.current) : undefined), []);

  return (
    <div className="page" ref={root}>
      <header className="col">
        <p className="kicker">
          A lyrics count &middot; <span id="nsongs"></span> songs &middot; 11 genres
        </p>
        <h1>
          The words that are most <em>indie</em>
        </h1>
        <p className="dek">
          Hip hop has its own vocabulary. Does indie? We counted which words turn up in indie songs
          far more often than in everything else. The answer is less about heartbreak than about{' '}
          <mark>furniture, weather and public transport</mark>.
        </p>
        <div className="top">
          <p className="kicker">The most indie word in the data</p>
          <div id="topword"></div>
          <p className="stat" id="topstat"></p>
        </div>
        <div>
          <p className="kicker">Then come</p>
          <div id="poster"></div>
        </div>
      </header>

      <section className="col">
        <h2>Indie against whom?</h2>
        <p>
          A word is indie only relative to something. Against all other genres, indie sounds
          domestic and a bit English. Against metal it sounds cheerful. Against hip hop it sounds
          like someone who has never said &ldquo;y&rsquo;all&rdquo;. Pick the comparison.
        </p>
        <div className="chips" id="chips" role="group" aria-label="Compare indie with"></div>
      </section>
      <section className="wide tight">
        <div className="lists">
          <div>
            <h3>Most indie</h3>
            <p className="note">
              Times as likely to appear in an indie song as in a <span className="cmpname"></span>{' '}
              song.
            </p>
            <ol id="most" className="pos"></ol>
          </div>
          <div>
            <h3>Least indie</h3>
            <p className="note">
              Times <em>less</em> likely to appear in an indie song than in a{' '}
              <span className="cmpname"></span> song.
            </p>
            <ol id="least"></ol>
          </div>
        </div>
        <p className="note col left">
          Ranked by the cautious end of each estimate, so a rare word with a lucky streak
          doesn&rsquo;t outrank a common word with a steady lead. Tap any word to look it up below.
        </p>
      </section>

      <section className="wide" id="explorer">
        <div className="col left intro">
          <h2>Every word, plotted</h2>
          <p>
            Each dot is one of <span id="nwords"></span> words. Higher means more indie. Further
            right means more common. The famous words of pop, <em>love</em>, <em>baby</em>,{' '}
            <em>heart</em>, all sit below the line.
          </p>
        </div>
        <div className="explore">
          <div>
            <div className="chart">
              <canvas
                id="sc"
                role="img"
                aria-label="Scatter plot of every word: share of indie songs containing it, against how many times more likely it is in indie than the comparison genre. The ranked lists above give the same data as text."
              ></canvas>
            </div>
            <div className="axis">
              <span>&larr; rare in indie songs</span>
              <span>in most indie songs &rarr;</span>
            </div>
          </div>
          <div>
            <div className="field">
              <label htmlFor="wq">Look up a word</label>
              <input id="wq" list="wlist" autoComplete="off" placeholder="try: whiskey" />
              <datalist id="wlist"></datalist>
            </div>
            <div id="dword"></div>
            <p className="note" id="dsum"></p>
            <div id="dbars"></div>
            <p className="note">Share of each genre&rsquo;s songs that use the word at least once.</p>
          </div>
        </div>
      </section>

      <section className="wide">
        <div className="col left intro">
          <h2>Who sings the most indie?</h2>
          <p>
            Score every song by the words in it, average by artist, and you get a ruler for
            vocabulary. Each dot is an artist with at least eight songs, placed in the genre their
            catalogue was filed under. Indie artists lean right, as they should. So do a lot of
            people filed elsewhere.
          </p>
          <div className="field">
            <label htmlFor="aq">Find an artist</label>
            <input id="aq" list="alist" autoComplete="off" placeholder="try: Fleet Foxes" />
            <datalist id="alist"></datalist>
          </div>
          <p className="stat" id="ainfo"></p>
        </div>
        <div>
          <div className="chart">
            <canvas
              id="bs"
              role="img"
              aria-label="Artists by genre, positioned by how indie their vocabulary is. The lists below name the highest scorers."
            ></canvas>
          </div>
          <div className="axis">
            <span>&larr; vocabulary least like indie</span>
            <span>most like indie &rarr;</span>
          </div>
        </div>
        <div className="lists alists">
          <div>
            <h3>Most indie vocabulary</h3>
            <ol id="atop"></ol>
          </div>
          <div>
            <h3>Indie in everything but the label</h3>
            <p className="note">Highest scorers filed under another genre.</p>
            <ol id="aother"></ol>
          </div>
        </div>
      </section>

      <footer className="col">
        <p className="kicker">How this was counted</p>
        <p>
          Lyrics come from the{' '}
          <a href="http://millionsongdataset.com/musixmatch/" target="_blank" rel="noreferrer">
            musiXmatch dataset
          </a>
          , which publishes word counts (not full lyrics) for 237,662 tracks in the Million Song
          Dataset. Genre labels come from the{' '}
          <a href="http://www.ifs.tuwien.ac.at/mir/msd/" target="_blank" rel="noreferrer">
            MSD Allmusic Style Dataset
          </a>
          . &ldquo;Indie&rdquo; here means tracks labelled Indie Pop or College Rock.
        </p>
        <p>
          We kept English-language songs with a genre label (84,038 songs), then capped every
          artist at 20 songs per genre so prolific acts can&rsquo;t swamp the count. A word&rsquo;s
          score is the share of indie songs that use it at least once, divided by the same share
          for the comparison songs. Repeating a word forty times in one chorus counts once.
        </p>
        <p>
          What to keep in mind: the catalogue stops around 2010, so this is the indie of Belle and
          Sebastian and The Shins, not of today. The dataset covers only its 5,000 most common word
          stems, which we mapped back to their usual spelling, so <em>curl</em> also stands for{' '}
          <em>curls</em> and <em>curled</em>. Genre labels are noisy and a few artists are plainly
          misfiled. A handful of slurs were left out of the lists.
        </p>
        <p className="note">
          Inspired by Matt Daniels&rsquo;s{' '}
          <a href="https://pudding.cool/2017/09/hip-hop-words/" target="_blank" rel="noreferrer">
            The Words That Are Most Hip Hop
          </a>{' '}
          for The Pudding.
        </p>
      </footer>
      <div id="tip" hidden></div>
    </div>
  );
}

export default App;
