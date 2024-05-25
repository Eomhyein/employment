// src/routes/users.router.js
// 2. login API 만들기
// POST: /auth/sign-in
import express from 'express';
import { prisma } from '../utils/prisma.util.js'; // connectDb 연결
import bcrypt from 'bcrypt'; // bcrypt 리팩토링
import jwt from 'jsonwebtoken';

const router = express.Router();

// 2-3 액세스 토큰 생성 함수
// AccessToken(Payload에 사용자 ID를 포함하고 유효기간이 12시간)을 생성합니다.
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '12h' });
};

// 2. 로그인 API
router.post('/sign-in', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 2.1 로그인 정보 중 하나라도 빠진 경우 처리
    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해 주세요.' });
    }
    if (!password) {
      return res.status(400).json({ message: '비밀번호을 입력해 주세요.' });
    }

    // 2-2. 이메일 형식에 맞지 않는 경우 - “이메일 형식이 올바르지 않습니다.”
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: '이메일 형식이 올바르지 않습니다.' });
    }
    // 2-3. 이메일로 조회가 불가하거나 비밀번호가 다를 경우 - “인증 정보가 유효하지 않습니다”
    const user = await prisma.user.findUnique({
        where: { email: email }        // DB안의 email 컬럼안의 값이 req.body로 전달된email과 일치하는걸 user로 선언
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {  //email 불일치거나 user객체의 비번이랑 DB해싱비번이 불일치면
      return res.status(400).json({ message: '인증 정보가 유효하지 않습니다.' });
  }

  const token = generateAccessToken(user.id);

  return res.status(200).json({
      message: '로그인에 성공했습니다.',
      token,       //AccessToken을 반환합니다.
  });


    // // 2-4. 입력받은 사용자의 비밀번호와 데이터베이스에 저장된 비밀번호를 비교합니다.
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //   return res
    //     .status(401)
    //     .json({ message: '인증 정보가 유효하지 않습니다.' });
    // }
    // // 2-3 로그인에 성공하면, 사용자의 id를 바탕으로 토큰을 생성합니다.
    // const token = jwt.sign(
    //   {
    //     id: user.id,
    //   },
    //   'custom-secret-key',
    // );

    // // 2-4 authorization 쿠키에 Bearer 토큰 형식으로 JMT를 저장합니다.
    // res.cookie('authorization', `Bearer ${token}`);

    // return res.status(200).json({ message: '로그인 성공' });
  } catch (error) {
    next(error); // 에러가 발생하면 에러 핸들러로 전달합니다.
  }
});

export default router;
