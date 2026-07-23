import { useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Dialog from '../../components/ui/Dialog';
import { Icon } from '../../lib/icons';
import { getXp, addXp } from '../../lib/xp';
import { REWARDS } from '../../mock/rewards';

const ICON_MAP = {
  BookOpen: Icon.BookOpen,
  Vocab: Icon.Vocab,
  Sparkles: Icon.Sparkles,
  Play: Icon.Play,
};

export default function RewardsPage() {
  const [tab, setTab] = useState('shop');
  const [xp, setXpState] = useState(getXp);
  const [owned, setOwned] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vmg_owned') || '[]'); }
    catch { return []; }
  });
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vmg_purchases') || '[]'); }
    catch { return []; }
  });
  const [selected, setSelected] = useState(null);

  function handleRedeem(item) {
    if (xp < item.price || owned.includes(item.id)) return;
    const newXp = addXp(-item.price);
    setXpState(newXp);

    const newOwned = [...owned, item.id];
    setOwned(newOwned);
    localStorage.setItem('vmg_owned', JSON.stringify(newOwned));

    const record = { itemId: item.id, itemName: item.name, price: item.price, date: new Date().toISOString() };
    const newHistory = [record, ...history];
    setHistory(newHistory);
    localStorage.setItem('vmg_purchases', JSON.stringify(newHistory));

    setSelected(item);
  }

  function renderContent(item) {
    const c = item.content;
    switch (c.type) {
      case 'lessons':
        return (
          <div className="reward-content-list">
            {c.items.map((l, i) => (
              <div key={i} className="reward-lesson-item">
                <div className="reward-lesson-title">{l.title}</div>
                <div className="reward-lesson-meta">{l.subject} · {l.level} · {l.time}</div>
              </div>
            ))}
          </div>
        );
      case 'vocabulary':
        return (
          <div className="reward-vocab-grid">
            {c.items.map((v, i) => (
              <div key={i} className="reward-vocab-card">
                <div className="reward-vocab-word">{v.word}</div>
                <div className="reward-vocab-meaning">{v.meaning}</div>
                <div className="reward-vocab-example">"{v.example}"</div>
              </div>
            ))}
          </div>
        );
      case 'prompts':
        return (
          <div className="reward-content-list">
            {c.items.map((p, i) => (
              <div key={i} className="reward-prompt-item">
                <span className="reward-prompt-num">{i + 1}.</span>
                <span className="reward-prompt-text">{p}</span>
                <button className="reward-copy-btn" onClick={() => { navigator.clipboard?.writeText(p); }}>
                  <Icon.Check size={14} />
                </button>
              </div>
            ))}
          </div>
        );
      case 'webinar':
        return (
          <div className="reward-webinar">
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)', marginBottom: 16 }}>{c.desc}</p>
            <div className="reward-webinar-info"><Icon.Calendar size={16} /> {c.date}</div>
            <div className="reward-webinar-info"><Icon.Clock size={16} /> {c.time}</div>
            <div className="reward-webinar-info"><Icon.Mic size={16} /> {c.speaker}</div>
            <Button variant="primary" href={c.link} target="_blank" rel="noopener noreferrer" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
              Đăng ký ngay <Icon.ArrowRight size={16} />
            </Button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="page-enter">
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1><Icon.CartAlt size={24} /> Cửa hàng phần thưởng</h1>
        <div className="reward-xp-total">🔥 {xp.toLocaleString()} XP</div>
      </div>

      <div className="reward-tabs">
        <button className={`reward-tab ${tab === 'shop' ? 'active' : ''}`} onClick={() => setTab('shop')}>Vật phẩm</button>
        <button className={`reward-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Lịch sử giao dịch</button>
      </div>

      {tab === 'shop' ? (
        <div className="reward-grid">
          {REWARDS.map(item => {
            const ItemIcon = ICON_MAP[item.iconType] || Icon.Book;
            const isOwned = owned.includes(item.id);
            const canAfford = xp >= item.price;
            return (
                <Card key={item.id} className="reward-card">
                <div className="reward-card-icon"><ItemIcon size={32} /></div>
                <h3 className="reward-card-name">{item.name}</h3>
                <p className="reward-card-desc">{item.desc}</p>
                <div className="reward-card-price">{item.price} XP</div>
                {isOwned ? (
                  <Button variant="primary" size="sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSelected(item)}>
                    <Icon.Check size={14} /> Xem
                  </Button>
                ) : canAfford ? (
                  <Button variant="primary" size="sm" label="Đổi ngay" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleRedeem(item)} />
                ) : (
                  <Button size="sm" isDisabled style={{ width: '100%', justifyContent: 'center', opacity: .4, cursor: 'not-allowed', background: 'var(--surface)', overflow: 'hidden' }}>
                    Còn thiếu {item.price - xp} XP
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="history-list">
          {history.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 48, color: 'var(--muted)', fontSize: 14 }}>
              Bạn chưa đổi vật phẩm nào
            </Card>
          ) : (
            history.map((h, i) => (
              <div key={i} className="history-item">
                <div className="history-item-info">
                  <div className="history-item-name">{h.itemName}</div>
                  <div className="history-item-date">{new Date(h.date).toLocaleDateString('vi-VN')} {new Date(h.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="history-item-price">-{h.price} XP</div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog isOpen={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        {selected && (
          <>
            <h2>{selected.name}</h2>
            <div>{renderContent(selected)}</div>
          </>
        )}
      </Dialog>
    </div>
  );
}
