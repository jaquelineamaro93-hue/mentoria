export default function Home() {
  return (
    <div style={{ textAlign: 'center', paddingTop: '50vh' }}>
      <h1>Redirecionando...</h1>
      <script>{`window.location.href = '/auth'`}</script>
    </div>
  );
}
