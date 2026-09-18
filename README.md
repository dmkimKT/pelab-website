# Koreatech PELab Website

한국기술교육대학교 전력전자연구실(PELab) 홈페이지. 정적 HTML 한 파일(`index.html`)로 구성되어 있어 별도 빌드 과정이 없습니다.

## 파일

| 파일 | 역할 |
| --- | --- |
| `index.html` | 홈페이지 전체 (HTML + CSS + JS 단일 파일) |
| `vercel.json` | Vercel 배포 설정 (보안 헤더, 깔끔한 URL) |
| `.gitignore` | Git 제외 파일 |

## 배포 흐름

```
index.html 수정  →  GitHub push  →  Vercel 자동 배포  →  xxxx.vercel.app
                                                          ↓  학교 DNS 연결
                                                  power.koreatech.ac.kr
```

## 학교 도메인(power.koreatech.ac.kr) 연결

1. Vercel 프로젝트 → **Settings → Domains → Add Domain** → `power.koreatech.ac.kr` 입력
2. Vercel이 보여주는 DNS 값을 확인합니다.
   - **CNAME** → `cname.vercel-dns.com` 또는 프로젝트 전용 값 (예: `xxxxxxxx.vercel-dns-017.com`)
   - **A 레코드** → `76.76.21.21` (Vercel 공용 anycast IP)
3. 학교 도메인 사용신청서의 **서버 IP** 칸에 `76.76.21.21`을 적고, 비고에 "외부 호스팅(Vercel) 사용. A 레코드 76.76.21.21 또는 CNAME cname.vercel-dns.com 중 하나로 설정 요청"을 함께 적어 제출합니다.
4. 학교 전산 부서가 DNS 레코드를 등록하면 Vercel Domains 화면의 상태가 **Valid Configuration**으로 바뀌고, HTTPS 인증서는 Vercel이 자동 발급합니다.

> 참고: `76.76.21.21`은 Vercel이 여러 고객 사이트를 함께 서비스하는 공용 IP입니다. 반드시 Vercel에 도메인을 먼저 추가해 두어야 합니다.

## 내용 수정하기

`index.html`을 열어 해당 부분을 수정한 뒤 GitHub에 커밋하면 자동으로 반영됩니다.

- 멤버: `<!-- ===== MEMBERS ===== -->` 섹션의 `.member` 카드 복사/수정
- 논문: `<!-- ===== PUBLICATION ===== -->` 섹션의 `<li class="pub">` 항목 추가 (필터 버튼의 개수 숫자도 함께 수정)
- 프로젝트: `<!-- ===== PROJECT ===== -->` 섹션의 `<tr>` 행 추가
- 교수님 사진: `<div class="portrait">…</div>`를 `<img class="portrait" src="photo.jpg" alt="김동민 교수">`로 바꾸고 사진 파일을 같은 폴더에 추가
