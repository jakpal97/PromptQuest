import './globals.css';

export const metadata = {
  title: 'Prompt Quest — AI Training RPG',
  description: 'Platforma szkoleniowa AI w formie gry RPG',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
