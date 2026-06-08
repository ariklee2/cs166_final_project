from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import random # Used to generate random integer IDs

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

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    login_input = data.get('username')
    password_input = data.get('password')

    if not login_input or not password_input:
        return jsonify({"error": "Username and password are required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        # Using RealDictCursor so data rows look like dictionaries
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Query the exact matching username identifier
        query = "SELECT login, password, role FROM users WHERE login = %s;"
        cur.execute(query, (login_input,))
        user_record = cur.fetchone()

        # Validation Rule: Check if user exists
        if not user_record:
            return jsonify({"error": "Invalid username or password configuration."}), 401

        # Validation Rule: Check password directly
        if user_record['password'] != password_input:
            return jsonify({"error": "Invalid username or password configuration."}), 401

        # Success match found
        return jsonify({
            "message": "Login authorization successful!",
            "login": user_record['login'],
            "role": user_record['role']
        }), 200

    except Exception as e:
        print(f"Database Auth Failure Error: {e}")
        return jsonify({"error": "Internal database server structural error"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

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

@app.route('/api/auction/end', methods=['POST'])
def end_auction():
    data = request.json
    item_id = data.get('item_id')
    seller_login = data.get('seller_login')

    if not item_id or not seller_login:
        return jsonify({"error": "Missing item target context or seller authorization"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Verify that this item actually belongs to the requesting seller
        cur.execute("SELECT seller_login FROM item WHERE item_id = %s;", (item_id,))
        item_record = cur.fetchone()

        if not item_record:
            return jsonify({"error": "Item not found."}), 404
        if item_record['seller_login'] != seller_login:
            return jsonify({"error": "Unauthorized. Only the seller can end this auction."}), 403

        # 2. Find the highest bidder from the bid ledger table for this auction
        cur.execute("""
            SELECT b.buyer_login 
            FROM bid b
            JOIN auction a ON b.auction_id = a.auction_id
            WHERE a.item_id = %s
            ORDER BY b.bid_amount DESC, b.bid_timestamp ASC
            LIMIT 1;
        """, (item_id,))
        highest_bidder_record = cur.fetchone()
        
        winner_login = highest_bidder_record['buyer_login'] if highest_bidder_record else None
        winner_role = 'Buyer' if winner_login else None

        # 3. Complete the auction transaction block: set status to 'Closed' and save the winner
        update_auction_query = """
            UPDATE auction 
            SET auction_status = 'Closed',
                winner_login = %s,
                winner_role = %s
            WHERE item_id = %s;
        """
        cur.execute(update_auction_query, (winner_login, winner_role, item_id))

        if winner_login:
            # Look up the item name to make the notification text clear
            cur.execute("SELECT item_name FROM item WHERE item_id = %s;", (item_id,))
            item_info = cur.fetchone()
            item_name = item_info['item_name'] if item_info else "an item"
            
            insert_notif_query = """
                INSERT INTO notification (username, message) 
                VALUES (%s, %s);
            """
            cur.execute(
                insert_notif_query, 
                (winner_login, f"🏆 Congratulations! You won the auction for '{item_name}'! You can now proceed to checkout.")
            )
        
        # Commit everything as an atomic transaction block
        conn.commit()
        return jsonify({
            "message": "Auction successfully closed!", 
            "winner": winner_login if winner_login else "No bids placed"
        }), 200

    except Exception as e:
        if conn: conn.rollback()
        print(f"Closure Error: {e}")
        return jsonify({"error": "Internal ledger processing failure"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/items', methods=['GET'])
def get_items():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Pull layout strings cleanly, including shipment tracking information
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
                a.auction_status,
                a.winner_login,
                s.tracking_number,
                s.shipment_status,
                s.address AS shipping_address
            FROM item i 
            LEFT JOIN auction a ON i.item_id = a.item_id
            LEFT JOIN shipment s ON a.auction_id = s.auction_id;
        """)
        items = cur.fetchall()
        return jsonify(items), 200
    except Exception as e:
        print(f"Fetch Error: {e}")
        return jsonify({"error": "Failed to fetch items"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/bid', methods=['POST'])
def place_bid():
    data = request.json
    item_id = data.get('item_id')
    buyer_login = data.get('buyer_login')
    bid_amount = data.get('bid_amount')
    buyer_role = 'Buyer' 

    if not all([item_id, buyer_login, bid_amount]):
        return jsonify({"error": "Missing item target context or pricing parameters"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Look up the matching active auction_id linked to the selected item
        cur.execute("SELECT auction_id, current_highest_bid FROM auction WHERE item_id = %s FOR UPDATE;", (item_id,))
        auction_record = cur.fetchone()

        if not auction_record:
            return jsonify({"error": "No matching active auction found for this item."}), 404

        # 2. Server-side validation
        if float(bid_amount) <= float(auction_record['current_highest_bid']):
            return jsonify({"error": f"Bid too low. Someone else already bid ${auction_record['current_highest_bid']}"}), 400

        auction_id = auction_record['auction_id']
        bid_id = random.randint(1000, 999999) 

        # 3. Step One: Insert record into the BID table
        insert_bid_query = """
            INSERT INTO bid (bid_id, auction_id, buyer_login, buyer_role, bid_amount)
            VALUES (%s, %s, %s, %s, %s);
        """
        cur.execute(insert_bid_query, (bid_id, auction_id, buyer_login, buyer_role, bid_amount))

        # 4. Step Two: Keep tables in sync by updating AUCTION's highest tracking bracket
        update_auction_query = """
            UPDATE auction 
            SET current_highest_bid = %s 
            WHERE auction_id = %s;
        """
        cur.execute(update_auction_query, (bid_amount, auction_id))

        cur.execute("SELECT seller_login, item_name FROM item WHERE item_id = %s;", (item_id,))
        item_info = cur.fetchone()

        if item_info:
            seller = item_info['seller_login']
            item_name = item_info['item_name']
            
            # Make sure this code matches the helper function you created earlier
            insert_notif_query = """
                INSERT INTO notification (username, message) 
                VALUES (%s, %s);
            """
            cur.execute(
                insert_notif_query, 
                (seller, f"🎉 Someone placed a new bid of ${float(bid_amount):.2f} on your item: '{item_name}'!")
            )

        # Commit everything as an atomic transaction block
        conn.commit()
        return jsonify({"message": "Bid successfully placed and synced!", "bid_id": bid_id}), 201

    except psycopg2.IntegrityError as e:
        if conn: conn.rollback()
        print(f"Integrity Constraint Failure: {e}")
        return jsonify({"error": "User account permission alignment structural failure."}), 400
    except Exception as e:
        if conn: conn.rollback()
        print(f"Bidding Processing Error Exception: {e}")
        return jsonify({"error": "Internal ledger server processing failure"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/checkout/place-order', methods=['POST'])
def place_order():
    data = request.json
    item_id = data.get('item_id')
    buyer_login = data.get('buyer_login')
    address = data.get('address')

    if not all([item_id, buyer_login, address]):
        return jsonify({"error": "Missing item, buyer, or shipping address context"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Fetch the closed auction details to grab auction_id and final bid amount
        cur.execute("""
            SELECT auction_id, current_highest_bid, winner_login, auction_status 
            FROM auction 
            WHERE item_id = %s;
        """, (item_id,))
        auction_record = cur.fetchone()

        if not auction_record:
            return jsonify({"error": "Matching auction ledger not found"}), 404
        if auction_record['auction_status'] != 'Closed':
            return jsonify({"error": "This auction is still actively open"}), 400
        if auction_record['winner_login'] != buyer_login:
            return jsonify({"error": "Unauthorized. You did not win this auction"}), 403

        auction_id = auction_record['auction_id']
        final_amount = auction_record['current_highest_bid']

        # Generate unique IDs for the new payment and shipment rows
        payment_id = random.randint(1000, 999999)
        shipment_id = random.randint(1000, 999999)
        tracking_number = f"TRK-{random.randint(100000, 999999)}"

        # 2. Insert into PAYMENT table
        insert_payment_query = """
            INSERT INTO payment (payment_id, auction_id, buyer_login, buyer_role, amount, payment_status)
            VALUES (%s, %s, %s, 'Buyer', %s, 'Completed');
        """
        cur.execute(insert_payment_query, (payment_id, auction_id, buyer_login, final_amount))

        # 3. Insert into SHIPMENT table
        insert_shipment_query = """
            INSERT INTO shipment (shipment_id, auction_id, address, shipment_status, tracking_number)
            VALUES (%s, %s, %s, 'Pending', %s);
        """
        cur.execute(insert_shipment_query, (shipment_id, auction_id, address, tracking_number))

        # Commit both updates as an interconnected transactional unit
        conn.commit()
        return jsonify({
            "message": "Order placed successfully!",
            "payment_id": payment_id,
            "shipment_id": shipment_id,
            "tracking_number": tracking_number
        }), 201

    except psycopg2.IntegrityError as e:
        if conn: conn.rollback()
        print(f"Checkout Integrity Constraint Error: {e}")
        return jsonify({"error": "This auction order has already been processed and checked out."}), 400
    except Exception as e:
        if conn: conn.rollback()
        print(f"Checkout Internal Error: {e}")
        return jsonify({"error": "Internal ledger processing failure"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Missing lookup username context indicator parameter"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT login, password, phone_num, address, role, favorite_category FROM users WHERE login = %s;", (username,))
        user_data = cur.fetchone()
        
        if not user_data:
            return jsonify({"error": "No matching data record profile found."}), 404
            
        return jsonify(user_data), 200
    except Exception as e:
        print(f"Profile Read Error Exception: {e}")
        return jsonify({"error": "Internal ledger extraction database failure"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/user/update', methods=['PUT'])
def update_user_profile():
    data = request.json
    current_login = data.get('current_login')
    new_login = data.get('new_login')
    password = data.get('password')
    phone_num = data.get('phone_num')
    address = data.get('address')
    favorite_category = data.get('favorite_category')

    if not all([current_login, new_login, password, phone_num, address]):
        return jsonify({"error": "All fundamental core details require structural validation entries."}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Update statement triggers structural CASCADE parameters down constraints cleanly
        update_query = """
            UPDATE users 
            SET login = %s, password = %s, phone_num = %s, address = %s, favorite_category = %s
            WHERE login = %s;
        """
        cur.execute(update_query, (new_login, password, phone_num, address, favorite_category, current_login))
        conn.commit()

        return jsonify({"message": "Relational structural user layout table updated successfully!", "login": new_login}), 200

    except psycopg2.IntegrityError as e:
        if conn: conn.rollback()
        print(f"Update Unique Key Violation: {e}")
        return jsonify({"error": f"The requested username '{new_login}' is already occupied by another profile index."}), 400
    except Exception as e:
        if conn: conn.rollback()
        print(f"Profile Database Mutator Modification Error: {e}")
        return jsonify({"error": "Internal update processor failure"}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

if __name__ == '__main__':
    app.run(port=5000, debug=True)