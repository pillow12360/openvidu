import "dotenv/config";
import express from "express";
import cors from "cors";
import { AccessToken, WebhookReceiver } from "livekit-server-sdk";

const SERVER_PORT = process.env.SERVER_PORT || 6080;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";

const app = express();

// CORS 설정 수정
app.use(cors({
  origin: [
    'http://localhost:5080',
    'http://192.168.0.108:5080'  // React 서버 주소
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.raw({ type: "application/webhook+json" }));

// 토큰 생성 라우트
app.post('/token', async (req, res) => {
  try {
    const roomName = req.body.roomName;
    const participantName = req.body.participantName;

    console.log('Token request received:', { roomName, participantName });  // 디버깅을 위한 로그 추가

    if (!roomName || !participantName) {
      res.status(400).json({ errorMessage: "roomName and participantName are required" });
      return;
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
    });
    at.addGrant({ roomJoin: true, room: roomName });
    const token = await at.toJwt();

    console.log('Token generated successfully');  // 디버깅을 위한 로그 추가
    res.json({ token });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ errorMessage: "Failed to generate token" });
  }
});

// Webhook 설정
const webhookReceiver = new WebhookReceiver(
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
);

app.post('/livekit/webhook', async (req, res) => {
  try {
    const event = await webhookReceiver.receive(
        req.body,
        req.get("Authorization")
    );
    console.log('Webhook event received:', event);
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error("Error validating webhook event:", error);
    res.status(400).json({ error: "Invalid webhook request" });
  }
});

// 서버 시작
app.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log(`Server started on port: ${SERVER_PORT}`);
  console.log(`Server is accessible at: http://192.168.0.108:${SERVER_PORT}`);
});