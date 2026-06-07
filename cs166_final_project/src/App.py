from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import random # Used to generate random integer IDs since schema doesn't use SERIAL

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        dbname="postgres",
        user="postgres",
        password="crabbycakes@4621",
        port=5432
    )

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    login = data.get('username')
    password = data.get('password')
    phone_num = data.get('phone')
    address = data.get('address')
    role = 'Buyer' 

    if not all([login, password, phone_num, address]):
        return jsonify({"error": "All fields are required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        insert_query = """
            INSERT INTO users (login, password, phone_num, address, role)
            VALUES (%s, %s, %s, %s, %s);
        """
        cur.execute(insert_query, (login, password, phone_num, address, role))
        conn.commit()
        return jsonify({"message": "User registered successfully!", "login": login, "role": role}), 201
    except psycopg2.IntegrityError:
        if conn: conn.rollback()
        return jsonify({"error": f"The username '@{login}' is already taken."}), 400
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# --- NEW: ROUTE TO SUBMIT AND CREATE AN AUCTION ITEM ---
@app.route('/auction', methods=['POST'])
def create_auction():
    data = request.json
    
    item_name = data.get('item_name')
    category = data.get('category')
    starting_price = data.get('starting_price')
    image_url = data.get('image_url')
    item_condition = data.get('item_condition')
    description = data.get('description')
    
    # In a production app, get this from a session/token. 
    # For testing, we fallback to a dummy user or read from an added frontend payload.
    seller_login = data.get('seller_login') 

    if not all([item_name, category, starting_price, image_url, description]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Rule validation: Ensure user exists and has 'Seller' privileges to bypass the Foreign Key constraint
        cur.execute("UPDATE users SET role = 'Seller' WHERE login = %s", (seller_login,))
        
        # Fallback: If user doesn't exist yet, insert a test placeholder
        cur.execute("SELECT login FROM users WHERE login = %s", (seller_login,))
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO users (login, password, phone_num, address, role) VALUES (%s, 'pass', '123', 'Default St', 'Seller')",
                (seller_login,)
            )

        # Generate unique integer IDs manually since schema doesn't use standard SERIAL options
        item_id = random.randint(1000, 999999)
        auction_id = random.randint(1000, 999999)

        # 1. Insert item details
        insert_item_query = """
            INSERT INTO item (item_id, item_name, category, starting_price, image_url, item_condition, description, seller_login, seller_role)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Seller');
        """
        cur.execute(insert_item_query, (item_id, item_name, category, starting_price, image_url, item_condition, description, seller_login))

        # 2. Insert corresponding auction tracker block
        insert_auction_query = """
            INSERT INTO auction (auction_id, item_id, seller_login, seller_role, current_highest_bid, auction_status)
            VALUES (%s, %s, %s, 'Seller', %s, 'Active');
        """
        cur.execute(insert_auction_query, (auction_id, item_id, seller_login, starting_price))

        conn.commit()
        return jsonify({"message": "Auction item listed successfully!", "item_id": item_id}), 201

    except Exception as e:
        if conn: conn.rollback()
        print(f"Insertion Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

# --- REFACTORED: FETCHING TO DISCOVER REAL LISTINGS ---
@app.route('/api/items', methods=['GET'])
def get_items():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Pull layout strings cleanly to map with frontend keys
        cur.execute("""
            SELECT 
                i.item_id AS id,
                i.item_name,
                i.category,
                i.item_condition,
                i.description,
                i.image_url,
                i.seller_login,
                COALESCE(a.current_highest_bid, i.starting_price) AS current_bid,
                a.auction_status
            FROM item i 
            LEFT JOIN auction a ON i.item_id = a.item_id
            WHERE a.auction_status = 'Active' OR a.auction_status IS NULL;
        """)
        items = cur.fetchall()
        return jsonify(items), 200
    except Exception as e:
        print(f"Fetch Error: {e}")
        return jsonify({"error": "Failed to fetch items"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

if __name__ == '__main__':
    app.run(port=5000, debug=True)