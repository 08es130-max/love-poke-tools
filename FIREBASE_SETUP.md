# 大会・戦歴クラウド同期の初期設定

大会機能は **Firebase Authentication（匿名認証）** と **Cloud Firestore** を使用します。
ラブカのデッキ・登録ライブは従来どおりブラウザの `localStorage` に保存され、Firestoreへ送信されません。

## 1. FirebaseプロジェクトとWebアプリを作る

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成します。
2. 「プロジェクトの設定」→「マイアプリ」からWebアプリ（`</>`）を追加します。
3. 表示された `firebaseConfig` の値を控えます。Firebase SDK自体をnpmで追加する必要はありません。
4. Authenticationの「Sign-in method」で **匿名** を有効にします。
5. Authenticationの「設定」→「承認済みドメイン」にGitHub Pagesのドメイン（例：`08es130-max.github.io`）を追加します。

## 2. Cloud Firestoreを作る

Firebase Consoleの「Firestore Database」からデータベースを作成します。参加者が利用する地域に近いロケーションを選択してください。ロケーションは後から変更できません。

初期実装では次のドキュメントを使用します。コレクションやドキュメントを手作業で作る必要はありません。

- `lovepoke/active-tournament`: 現在開催中の1大会
- `tournaments/{大会ID}`: 終了済み大会ログ

## 3. Firestore Security Rulesを設定する

Firestoreの「ルール」に以下を設定して公開します。このルールは匿名認証に成功した利用者だけに読み書きを許可します。

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    match /lovepoke/active-tournament {
      allow read, create, update, delete: if signedIn();
    }

    match /tournaments/{tournamentId} {
      allow read, create, update, delete: if signedIn();
    }
  }
}
```

この構成ではサイトを利用できる匿名ユーザー全員が同じ大会を共有します。限定メンバーだけに編集を許可したい場合は、将来メール認証や大会コードごとの権限制御を追加してください。

## 4. Webアプリ設定を反映する

`firebase-config.js` の `null` を、手順1で表示された設定に置き換えます。

```js
window.LOVEPOKE_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

このFirebase Web設定はクライアント識別用の公開情報であり、管理者秘密鍵ではありません。アクセス制御は必ずAuthenticationとFirestore Security Rulesで行ってください。

## 5. GitHub Pagesへ公開して確認する

1. 変更をGitHub Pagesへデプロイします。
2. PWAを開き直し、「ポケモン」→「大会」を開きます。
3. 「同期中」と表示されれば接続完了です。
4. 2台の端末で同じページを開き、一方で大会開始・勝敗入力を行い、もう一方へ自動反映されることを確認します。

設定直後に以前のPWAが表示された場合は、一度アプリを閉じて再度開いてください。Service Workerが更新を検出すると新しいファイルへ自動的に切り替わります。

## データ形式と更新

大会ドキュメントは `schemaVersion: 1` を持ちます。今後形式を変更するときは番号を上げ、`tournament.js`の読み込み時に旧バージョンから変換する処理を追加してください。アプリ更新時にFirestoreの大会データを削除・初期化する処理はありません。
