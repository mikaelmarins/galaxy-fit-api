const oracledb = require('oracledb');

async function updateWorkouts() {
    const connection = await oracledb.getConnection({
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: process.env.ORACLE_CONNECTION_STRING
    });

    try {
        // Get the new user ID for mikaelsky1@gmail.com
        const userResult = await connection.execute(
            "SELECT ID FROM GALAXY_FIT_SYNC.USERS WHERE EMAIL = 'mikaelsky1@gmail.com'",
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!userResult.rows || userResult.rows.length === 0) {
            console.log('User mikaelsky1@gmail.com not found!');
            return;
        }

        const newUserId = userResult.rows[0].ID;
        console.log('New user ID:', newUserId);

        // Update all workout logs to use the new user ID
        const updateResult = await connection.execute(
            "UPDATE GALAXY_FIT_SYNC.WORKOUT_LOGS SET USER_ID = :newUserId WHERE USER_ID = 'fb85f467-b139-4d04-b654-f29a5ddfa6c3'",
            { newUserId },
            { autoCommit: true }
        );

        console.log('Updated workouts:', updateResult.rowsAffected);

        // Count workouts for new user
        const countResult = await connection.execute(
            "SELECT COUNT(*) as CNT FROM GALAXY_FIT_SYNC.WORKOUT_LOGS WHERE USER_ID = :userId",
            { userId: newUserId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log('Total workouts for user:', countResult.rows[0].CNT);

    } finally {
        await connection.close();
    }
}

updateWorkouts().then(() => {
    console.log('Done!');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
