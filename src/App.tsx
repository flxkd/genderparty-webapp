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
    const [showQR, setShowQR] = useState(false);

    const [user, setUser] = useState<TelegramUser | null>(null);
    const [qrUrl, setQrUrl] = useState<string>('');

    useEffect(() => {
        // Получаем данные пользователя из Telegram WebApp
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initDataUnsafe?.user) {
            setUser(tg.initDataUnsafe.user);
        }
    }, []);




    const handleGenerate = async () => {
        if (!user) {
            WebApp.showAlert('Telegram user data is not loaded.');
            return;
        }
        if (!gender) {
            WebApp.showAlert('Choose the baby\'s gender, please');
            return;
        }

        try {
            const response = await fetch('https://genderparty.duckdns.org/api/v1/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    username: user.username ?? null,
                    gender,
                    revealDateTime: "2025-05-24T12:45:36.006+07:00", // заглушка
                    title: "Title"                // заглушка
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.id) {
                setQrUrl("https://genderparty.duckdns.org/qr/"+data.id);
                setShowQR(true);
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

            {/*<div className="container">*/}
            {/*    <label>Дата и время события:</label>*/}
            {/*    <DatePicker*/}
            {/*        selected={selectedDate}*/}
            {/*        onChange={(date) => setSelectedDate(date)}*/}
            {/*        showTimeSelect*/}
            {/*        timeFormat="HH:mm"*/}
            {/*        timeIntervals={15}*/}
            {/*        dateFormat="Pp"*/}
            {/*        placeholderText="Выберите дату и время"*/}
            {/*    />*/}

            {/*    <p>Ваша дата: {revealDateTime}</p>*/}
            {/*    <p>Ваш часовой пояс: GMT{timezoneOffset}</p>*/}
            {/*</div>*/}

            <div className="card">
                <button onClick={handleGenerate}>
                    📱 Generate QR code
                </button>
            </div>

            {showQR && qrUrl && (
                <div className="qr-code">
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
                </div>
            )}
        </div>
    );
}

export default App;
