import './App.css'
import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import 'react-datepicker/dist/react-datepicker.css';
import {QRCodeSVG} from 'qrcode.react';

type TelegramUser = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
};

function App() {
    const [gender, setGender] = useState<'boy' | 'girl' | null>(null);
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [qrUrl, setQrUrl] = useState<string>('');
    const handleShare = async () => {
        if (!qrUrl) return;

        // Проверяем поддержку Web Share API
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Baby's gender QR Code",
                    url: qrUrl,
                });
                console.log("Share successful");
            } catch (error) {
                console.error("Share failed:", error);
            }
        } else {
            // Если нет поддержки, копируем ссылку
            try {
                await navigator.clipboard.writeText(qrUrl);
                WebApp.showAlert('Ссылка скопирована в буфер обмена');
            } catch {
                WebApp.showAlert('Не удалось скопировать ссылку');
            }
        }
    };

    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initDataUnsafe?.user) {
            setUser(tg.initDataUnsafe.user);
        }
    }, []);

    useEffect(() => {
        // При выборе пола сразу вызываем генерацию QR, если gender не null
        if (gender !== null) {
            generateQR();
        }
    }, [gender]);

    const generateQR = async () => {
        if (!user) {
            WebApp.showAlert('Telegram user data is not loaded.');
            return;
        }

        try {
            const response = await fetch('https://genderparty.duckdns.org/api/v1/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-ID': String(user.id),
                },
                body: JSON.stringify({
                    userId: user.id,
                    username: user.username ?? null,
                    gender,
                    revealDateTime: "2025-05-24T12:45:36.006+07:00",
                    title: "Title"
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.id) {
                setQrUrl("https://genderparty.duckdns.org/qr/" + data.id);
            } else {
                WebApp.showAlert('There is no url in the server response');
            }
        } catch (error) {
            console.error(error);
            WebApp.showAlert(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    return (
        <div className="container">
            <h3>🎉Select the baby's gender</h3>

            <div className="card">
                <button
                    onClick={() => setGender('boy')}
                    disabled={gender !== null}
                    style={{
                        backgroundColor: gender !== null ? '#999' : undefined,
                        color: gender !== null ? '#fff' : undefined,
                        cursor: gender !== null ? 'default' : 'pointer',
                        pointerEvents: gender !== null ? 'none' : 'auto',
                    }}
                >
                    👶 Boy
                </button>
                <button
                    onClick={() => setGender('girl')}
                    disabled={gender !== null}
                    style={{
                        backgroundColor: gender !== null ? '#999' : undefined,
                        color: gender !== null ? '#fff' : undefined,
                        cursor: gender !== null ? 'default' : 'pointer',
                        pointerEvents: gender !== null ? 'none' : 'auto',
                    }}
                >
                    🎀 Girl
                </button>
            </div>

            {gender !== null && (
                <p style={{ marginTop: '8px', fontStyle: 'italic', color: '#555' }}>
                    Gender selected
                </p>
            )}

            {qrUrl && (
                <div className="qr-section" style={{ marginTop: 20 }}>
                    <QRCodeSVG
                        value={qrUrl}
                        size={300}
                        level="H"
                        imageSettings={{
                            src: './marker.png',
                            height: 120,
                            width: 120,
                            excavate: true,
                        }}
                    />
                    <div style={{ marginTop: 10 }}>
                        <button onClick={handleShare} style={{ padding: '8px 16px', fontSize: '16px' }}>
                            📤 Поделиться
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
