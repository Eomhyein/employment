// src/routes/users.router.js
// 2. login API 만들기
// POST: /auth/sign-in
import express from 'express';
import { prisma } from '../utils/prisma.util.js'; // connectDb 연결
import bcrypt from 'bcrypt'; // bcrypt 리팩토링
import jwt from 'jsonwebtoken'; 

const router = express.Router();

// 2. 로그인 API
router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 2.1 로그인 정보 중 하나라도 빠진 경우 처리
    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해 주세요.' });
    }
    if (!password) {
      return res.status(400).json({ message: '비밀번호을 입력해 주세요.' });
    }

    // 2.2 이메일 형식에 맞지 않는 경우
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: '이메일 형식이 올바르지 않습니다.' });
    }
    // 2.3 이메일로 조회가 불가하거나 비밀번호가 다를 경우
    const user = await prisma.users.findUnique({ where: { email: email } });

    // 2-4 입력받은 사용자의 비밀번호와 데이터베이스에 저장된 비밀번호를 비교합니다.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: '인증 정보가 유효하지 않습니다.' });
    }
    
    // 2-5 로그인에 성공하면, 사용자의 id를 바탕으로 토큰을 생성합니다.
    const token = jwt.sign(
      {
        id: user.id,
      },
      'custom-secret-key',
      {expiresIn:'12h'} //토큰 만료 시간을 12시간으로 설정
    );
    
    return res.status(200).json({ accessToken: token, message: '로그인 성공' });
  } catch (error) {
    next(error); // 에러가 발생하면 에러 핸들러로 전달합니다.
  }
});

// 유저 상세 페이지 요청 API 
router.get('/user-detail', async (req, res, next) => {
  try {
    // 유저 상세 정보를 보는 페이지 요청시-> 요청받은 access token을 헤더에서 보여준다.
    const authHeader = decodeURIComponent(req.headers["authorization"]);
    if (!authHeader) {
      return res.status(401).json({ message: '헤더 승인이 누락되었습니다.' });
    }
    //req header에서 Authorization 토큰 값을 가져온다.
    const token = authHeader.split(' ')[1];
    try {
      // 토큰을 확인한다.
      const decoded = jwt.verify(token, 'custom-secret-key'); // secret key
      // true면 요청한 페이지를 보여준다
      const user = await prisma.users.findUnique({ where: { id: decoded.id } });
      // false면 메시지를 보여준다.
      if (!user) {
        return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: '잘못된 토큰입니다.' });
    }
  } catch (error) {
    next(error);
  }
  
});
export default router;
