# 大会・麻雀戦歴クラウド同期の初期設定

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
- `mahjongMatches/{対局ID}`: 麻雀対局ログ（順位と最終持ち点）

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

    match /mahjongMatches/{matchId} {
      allow read, create, update, delete: if signedIn();
    }
  }
}