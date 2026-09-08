const FIREBASE_VERSION='10.14.1';
let contextPromise=null;
export function getFirebaseContext(){
  if(contextPromise)return contextPromise;
  contextPromise=(async()=>{
    const config=window.LOVEPOKE_FIREBASE_CONFIG;if(!config)throw new Error('Firebase設定がありません。');
    const [appModule,authModule,firestoreModule]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
    ]);
    const app=appModule.getApps().length?appModule.getApp():appModule.initializeApp(config);const auth=authModule.getAuth(app);
    if(!auth.currentUser)await authModule.signInAnonymously(auth);
    return {app,auth,db:firestoreModule.getFirestore(app),firestore:firestoreModule};
  })();return contextPromise;
}
