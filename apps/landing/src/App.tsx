import { useEffect } from 'react';
import { Scene } from '@/three/Scene';
import { InkSpine } from '@/components/InkSpine';
import { BrushUnderline } from '@/components/BrushUnderline';
import { initReveal, initSmoothScroll } from '@/scroll';

// Produkcja: aplikacja żyje pod /app na tym samym adresie (jeden projekt
// Netlify). W dev apka chodzi na osobnym porcie Expo.
const APP_URL =
  import.meta.env.VITE_APP_URL ?? (import.meta.env.DEV ? 'http://localhost:8081' : '/app');

function Hanko() {
  return <span className="hanko">畳</span>;
}

export default function App() {
  // po zamontowaniu DOM: płynny scroll (singleton) + odsłanianie sekcji
  useEffect(() => {
    initSmoothScroll();
    initReveal();
  }, []);

  return (
    <>
      <Scene />
      <div className="grain" />

      <header className="topbar">
        <div className="brand">
          <Hanko />
          TATAMI
        </div>
        <a className="btn btn-ghost" href={APP_URL}>
          Wejdź do aplikacji
        </a>
      </header>

      <main>
        <InkSpine />

        {/* ============ HERO ============ */}
        <section className="hero">
          <span className="kanji-bg kanji-mark">畳</span>
          <p className="label" data-reveal>
            Dziennik sztuk walki · BJJ / MMA / Muay Thai
          </p>
          <h1 className="display" data-reveal="2">
            Trenujesz.
            <br />
            <span className="accent">Mówisz.</span> Rośniesz.
          </h1>
          <div data-reveal="2">
            <BrushUnderline delay={0.35} />
          </div>
          <p className="tagline" data-reveal="3">
            60 sekund po treningu opowiadasz, co było na macie — TATAMI przepisuje, rozpoznaje
            techniki, liczy sparingi i pokazuje progres, którego wcześniej nie widziałeś.
          </p>
          <div className="cta-row" data-reveal="3">
            <a className="btn btn-vermilion" href={APP_URL}>
              Zacznij za darmo
            </a>
            <a className="btn btn-ghost" href="#glos">
              Zobacz, jak działa
            </a>
          </div>
          <div className="scroll-hint">
            <span className="label">przewiń</span>
          </div>
        </section>

        {/* ============ GŁOS → AI ============ */}
        <section id="glos">
          <span className="kanji-side kanji-mark">声</span>
          <div className="feature">
            <div>
              <p className="num" data-reveal>
                01 / GŁOS
              </p>
              <h2 data-reveal="2">Mów, resztą zajmie się AI</h2>
              <div data-reveal="2">
                <BrushUnderline />
              </div>
              <p className="lead" data-reveal="3">
                Zero wyklikiwania po treningu. Nagrywasz notatkę głosową jak wiadomość do
                kumpla — transkrypcja, techniki, oceny i sparingi układają się same. Ty tylko
                potwierdzasz.
              </p>
            </div>
            <div className="washi" data-reveal="2">
              <p className="w-label">Twoja notatka → analiza</p>
              <p className="quote">
                „Dziś no-gi. Drillowałem duszenie zza pleców i trójkąt, w sparingu złapałem
                gilotynę…”
              </p>
              <div className="chips">
                <span className="chip v">duszenie zza pleców</span>
                <span className="chip v">trójkąt</span>
                <span className="chip v">gilotyna</span>
                <span className="chip g">no-gi</span>
                <span className="chip g">sparing 5 rund</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ TECHNIKI ============ */}
        <section>
          <span className="kanji-side kanji-mark">技</span>
          <div className="feature reverse">
            <div>
              <p className="num" data-reveal>
                02 / TECHNIKA
              </p>
              <h2 data-reveal="2">Każda technika pod kontrolą</h2>
              <div data-reveal="2">
                <BrushUnderline />
              </div>
              <p className="lead" data-reveal="3">
                Słownik technik z aliasami (RNC, mata leão — rozumiemy slang), poziomy
                opanowania od „poznana” do „działa w sparingu” i materiały wideo dobrane przez
                AI do tego, co właśnie ćwiczysz.
              </p>
            </div>
            <div className="washi" data-reveal="2">
              <p className="w-label">Twój arsenał</p>
              <div className="tech-row">
                <div>
                  <div className="t-name">Duszenie zza pleców</div>
                  <div className="t-sub">rear naked choke · 14× ćwiczona</div>
                </div>
                <div className="dots">
                  <i className="dot on" /> <i className="dot on" /> <i className="dot on" />
                  <i className="dot on" /> <i className="dot" />
                </div>
              </div>
              <div className="tech-row">
                <div>
                  <div className="t-name">Trójkąt</div>
                  <div className="t-sub">triangle choke · 9× ćwiczona</div>
                </div>
                <div className="dots">
                  <i className="dot on" /> <i className="dot on" /> <i className="dot on" />
                  <i className="dot" /> <i className="dot" />
                </div>
              </div>
              <div className="tech-row">
                <div>
                  <div className="t-name">Low kick</div>
                  <div className="t-sub">muay thai · 21× ćwiczona</div>
                </div>
                <div className="dots">
                  <i className="dot on" /> <i className="dot on" /> <i className="dot on" />
                  <i className="dot on" /> <i className="dot on" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ PROGRES ============ */}
        <section>
          <span className="kanji-side kanji-mark">道</span>
          <div className="feature">
            <div>
              <p className="num" data-reveal>
                03 / DROGA
              </p>
              <h2 data-reveal="2">Progres, który widać</h2>
              <div data-reveal="2">
                <BrushUnderline />
              </div>
              <p className="lead" data-reveal="3">
                Serie treningów, bilans sparingów, tapy za i przeciw, waga, stopnie. Wszystko
                działa offline — na sali bez zasięgu też. Twoje dane są prywatne i możesz je
                zabrać jednym eksportem.
              </p>
            </div>
            <div className="washi" data-reveal="2">
              <p className="w-label">Ostatnie 30 dni</p>
              <div className="stat-grid">
                <div className="stat-cell">
                  <div className="v">
                    12<em>↑</em>
                  </div>
                  <div className="k">treningów</div>
                </div>
                <div className="stat-cell">
                  <div className="v">
                    7<em>:</em>3
                  </div>
                  <div className="k">tapy za/przeciw</div>
                </div>
                <div className="stat-cell">
                  <div className="v">
                    5<em>🔥</em>
                  </div>
                  <div className="k">seria dni</div>
                </div>
              </div>
              <div className="heat">
                <i className="h1" /> <i /> <i className="h2" /> <i className="h3" />
                <i className="h2" /> <i /> <i className="h1" /> <i className="h3" />
                <i className="h3" /> <i className="h2" /> <i /> <i className="h1" />
                <i className="h2" /> <i className="h3" />
              </div>
            </div>
          </div>
        </section>

        {/* ============ JAK TO DZIAŁA ============ */}
        <section>
          <p className="num" data-reveal>
            04 / RYTUAŁ
          </p>
          <h2 className="display" style={{ fontSize: 'clamp(30px,4.4vw,48px)' }} data-reveal="2">
            Trzy ruchy. Jak dobra kombinacja.
          </h2>
          <div data-reveal="2">
            <BrushUnderline />
          </div>
          <div className="steps">
            <div className="step" data-reveal>
              <div className="s-kanji">一</div>
              <h3>Nagraj</h3>
              <p>
                Po treningu mówisz 60 sekund: co ćwiczyliście, co weszło, co uciekło. Offline?
                Nagranie poczeka na zasięg.
              </p>
            </div>
            <div className="step" data-reveal="2">
              <div className="s-kanji">二</div>
              <h3>Potwierdź</h3>
              <p>
                AI rozkłada notatkę na techniki, sparingi i oceny. Widzisz oryginał obok —
                poprawiasz jednym dotknięciem.
              </p>
            </div>
            <div className="step" data-reveal="3">
              <div className="s-kanji">三</div>
              <h3>Rośnij</h3>
              <p>
                Materiały do słabych punktów, poziomy opanowania, cele i statystyki. Droga
                widoczna czarno na białym.
              </p>
            </div>
          </div>
        </section>

        {/* ============ FINAŁ ============ */}
        <section className="finale">
          <p className="label" data-reveal>
            始 · zacznij dziś
          </p>
          <h2 data-reveal="2">
            Mata pamięta <span style={{ color: 'var(--vermilion)' }}>wszystko.</span>
            <br />
            Teraz Ty też.
          </h2>
          <p className="sub" data-reveal="3">
            Darmowe konto. Twoje dane należą do Ciebie — eksport i usunięcie jednym
            przyciskiem.
          </p>
          <a className="btn btn-vermilion" href={APP_URL} data-reveal="3">
            Otwórz TATAMI
          </a>
        </section>
      </main>

      <footer>
        <div className="f-brand">
          <Hanko />
          TATAMI
        </div>
        <div>Dziennik sztuk walki · offline-first · Twoje dane, Twoja droga 道</div>
      </footer>
    </>
  );
}
