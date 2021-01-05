MMR.currentLangID = localStorage.getItem('currentLangID') || 'en';

MMR.lang = {
    en: {
        changeLanguage: 'Change Language',
        goodMorning: 'Good Morning, ',
        goodAfternoon: 'Good Afternoon, ',
        goodEvening: 'Good Evening, ',
        title: 'My Meeting Rooms',
        more: 'More ',
        reload: 'Reload ',
        myReservations: 'My Reservations',
        availableNow: 'Available Now',
        latestNews: 'News&Sharing',
        delete: 'Delete',
        deleteTitle: 'Are you sure you want to delete this item?',
        deleteButtonText: 'Yes, delete it',
        deleteSuccessTitle: 'Deleted',
        newTitle: 'New Reservation',
        editTitle: 'Edit Reservation',
        viewTitle: 'Reservation Detail',
        editSuccessTitle: 'Saved',
        saveButtonText: 'Save',
        cancelButtonText: 'Cancel',
        closeButtonText: 'Close',
        fromTo: 'Time',
        selectFromDatetime: 'From date/time',
        selectToDatetime: 'To date/time',
        purpose: 'Purpose',
        purposeMeeting: 'Meeting',
        purposeOther: 'Other',
        comment: 'Comment',
        mention: 'Mention',
        reservedBy: 'Reserved By',
        mentionComment: 'Use @ to mention someone',
        errorUnknown: 'Oops, something went wrong, please try again.',
        errorRequired: 'One or more required fields are not filled in.',
        errorAreaRequired: 'At least one area must be selected.',
        errorMention:
            'The user mentioned does not exist. Make sure you are using the correct mention format (@USERID).',
        errorRoomNotAvailable: 'The room is not available for specified period.',
        errorInvalidDate: 'The date/time is invalid.',
        errorInvalidTermDate: 'The To date must be greater than the From.',
        errorInvalidTermTime: 'The To time must be greater than the From.',
        errorTermTooLongForSearch: 'The period must be shorter than 30 days.',
        errorTermTooLongForReserve: 'The period must be shorter than 24 hours.',
        errorInvalidToken: 'The user token is invalid.',
        errorUserNotFound: 'Could not find the user.',
        errorUserTokenMismatch: 'The client token does not match the server record.',
        errorReservationNotFound: 'Could not find the reservation record. It may has been deleted.',
        errorNotAuthorized: 'You have no authorization to edit this record.',
        builtWith: 'Built With',
        links: 'Quick Links',
        contact: 'Contact Us',
        statistics: 'Statistics',
        mostPopular: 'Most Popular Room',
        mostCancelled: 'Most Cancelled Room',
        averageUsageRates: 'Average Usage Rate for Past 30 Days',
        notEnoughData: 'Not enough data to calculate',
        selectArea: 'Select area',
        selectRoom: 'Select meeting room',
        multiselectSelectLabel: 'Press enter to select',
        multiselectSelectedLabel: 'Selected',
        multiselectDeSelectedLabel: 'Press enter to remove',
        multiselectNoResult: 'No elements found',
        multiselectNoOptions: 'List is empty',
        multiselectMaxElements: 'Maximum options have been selected',
        search: 'Search',
        clickToEdit: 'Click to edit',
        clickToCViewDetails: 'Click to view details',
        clickToReserve: 'Click to reserve or drag to select a reservation period',
        driftWelcomeMessage: 'Hi, Thanks for visiting our site. Please feel free to chat with me if you have anything.',
        driftAwayMessage:
            'Hi, Thanks for visiting our site. We’re away right now, but if you leave us a message we’ll get back to you soon.',
    },
    ja: {
        changeLanguage: '言語切り替え',
        goodMorning: 'おはようございます、',
        goodAfternoon: 'こんにちは、',
        goodEvening: 'こんばんは、',
        title: 'My Meeting Rooms',
        more: 'More ',
        reload: '最新状態に更新 ',
        myReservations: 'わたしの予約',
        availableNow: '今すぐ利用可能',
        latestNews: 'お知らせ&共有',
        delete: '削除',
        deleteTitle: 'このアイテムを削除してもよろしいでしょうか？',
        deleteButtonText: 'はい、削除',
        deleteSuccessTitle: '削除しました',
        newTitle: '新規予約',
        editTitle: '予約編集',
        viewTitle: '予約詳細',
        editSuccessTitle: '保存しました',
        saveButtonText: '保存',
        cancelButtonText: 'キャンセル',
        closeButtonText: '閉じる',
        fromTo: '時間',
        selectFromDatetime: '開始日時を選択',
        selectToDatetime: '終了日時を選択',
        purpose: '目的',
        purposeMeeting: '会議',
        purposeOther: 'その他',
        comment: 'コメント',
        mention: 'メンション',
        reservedBy: '予約者',
        mentionComment: '@を使ってメンション',
        errorUnknown: '例外が発生しました。もう一度試してみてください。',
        errorRequired: '未入力の必須項目があります。',
        errorAreaRequired: 'エリアは最低1個の選択が必要です。',
        errorMention:
            'メンションしたユーザーが存在しません。正しいメンションフォーマット（@USERID）を使っているか確認してください。',
        errorRoomNotAvailable: '指定の期間にほかの予約が入っているため、予約できません。',
        errorInvalidDate: '無効な日時です。',
        errorInvalidTermDate: '終了日は開始日より大きい日時を設定してください。',
        errorInvalidTermTime: '終了時刻は開始時刻より大きい日時を設定してください。',
        errorTermTooLongForSearch: '期間は30日以内に設定してください。',
        errorTermTooLongForReserve: '期間は24時間以内に設定してください。',
        errorInvalidToken: 'ユーザートークンが無効です。',
        errorUserNotFound: 'ユーザーが見つかりませんでした。',
        errorUserTokenMismatch: 'クライアントトークンがサーバーと一致しません。',
        errorReservationNotFound: '予約データが見つかりませんでした。削除された可能性があります。',
        errorNotAuthorized: 'このレコードを変更する権限がありません。',
        builtWith: '利用OSS',
        links: 'リンク',
        contact: 'お問い合わせ',
        statistics: '簡易統計',
        mostPopular: '予約が多い会議室',
        mostCancelled: 'キャンセルが多い会議室',
        averageUsageRates: '過去30日間の平均利用率',
        notEnoughData: '計算するデータが存在しません',
        selectArea: 'エリアを選択',
        selectRoom: '会議室を選択',
        multiselectSelectLabel: 'Enterを押して選択',
        multiselectSelectedLabel: '選択済み',
        multiselectDeSelectedLabel: 'Enterを押して選択解除',
        multiselectNoResult: '検索条件に一致するデータが見つかりません',
        multiselectNoOptions: 'リストにデータがありません',
        multiselectMaxElements: '選択できる上限に達しました',
        search: '検索',
        clickToEdit: 'クリックして編集',
        clickToCViewDetails: 'クリックして詳細確認',
        clickToReserve: 'クリックして予約、または、ドラッグして期間選択',
        driftWelcomeMessage: '当サイトをご利用いただきありがとうございます。何かありましたらお気軽にご相談ください。',
        driftAwayMessage: 'ただいま不在にしております。メッセージを残していただければ、折り返しご連絡いたします。',
    },
};