# -*- coding: utf-8 -*-
"""
ユーザー管理 CLI (共有版 / appdb 使用)

  python manage_users.py init
  python manage_users.py add  <user> <password>
  python manage_users.py passwd <user> <password>
  python manage_users.py delete <user>
  python manage_users.py list
  python manage_users.py admin  <user> on|off      # 管理者権限の付与/解除
  python manage_users.py grant  <user>             # 購読を手動で有効化(振込対応など)
  python manage_users.py revoke <user>             # 購読を無効化
"""
import sys
import appdb


def main(argv):
    if not argv:
        print(__doc__); return 1
    cmd = argv[0]
    try:
        if cmd == "init":
            appdb.init_db(); print(f"OK: '{appdb.DB_NAME}' に users/sessions を用意しました。")
        elif cmd == "add" and len(argv) >= 3:
            appdb.init_db(); appdb.create_user(argv[1], argv[2]); print(f"OK: '{argv[1]}' を追加しました。")
        elif cmd == "passwd" and len(argv) >= 3:
            print("OK" if appdb.set_password(argv[1], argv[2]) else "該当ユーザーなし")
        elif cmd == "delete" and len(argv) >= 2:
            print("OK" if appdb.delete_user(argv[1]) else "該当ユーザーなし")
        elif cmd == "list":
            for u in appdb.list_users():
                adm = "管理" if u.get("is_admin") else "  "
                print(f"  #{u['id']:<3} {u['username']:<20} {adm} 購読:{u.get('sub_status','-'):<9} "
                      f"作成:{u['created_at']} 最終:{u['last_login']}")
        elif cmd == "admin" and len(argv) >= 3:
            appdb.init_db()
            print("OK" if appdb.set_admin(argv[1], argv[2].lower() in ("on", "1", "true", "yes")) else "該当ユーザーなし")
        elif cmd == "grant" and len(argv) >= 2:
            appdb.init_db(); appdb.update_subscription(argv[1], "manual", "active", None); print("OK: 購読を有効化しました")
        elif cmd == "revoke" and len(argv) >= 2:
            appdb.init_db(); appdb.update_subscription(argv[1], None, "canceled", None); print("OK: 購読を無効化しました")
        else:
            print(__doc__); return 1
    except Exception as e:  # noqa
        print("エラー:", e); return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
