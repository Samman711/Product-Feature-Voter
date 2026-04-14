from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# In-memory storage for users
# Key: username, Value: {"name": ..., "email": ..., "password": ...}
users = {}

# In-memory storage for features
features = [
    {"id": 1, "title": "Dark Mode Support", "description": "Enable eye-friendly dark themes across our iOS and Android applications.", "votes": 120},
    {"id": 2, "title": "Mobile App version", "description": "Release a native mobile application for better user experience.", "votes": 95},
    {"id": 3, "title": "API Documentation", "description": "Publish extensive technical API documentation with standard endpoints.", "votes": 84},
    {"id": 4, "title": "Custom Dashboards", "description": "Let users drag and drop charts to create their own custom views.", "votes": 42},
    {"id": 5, "title": "Integration with Slack", "description": "Get real-time notifications in your preferred Slack channels.", "votes": 30}
]
next_id = 6

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/help")
def help():
    return render_template("help.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        
        if username in users and users[username]["password"] == password:
            session["username"] = username
            session["name"] = users[username]["name"]
            return redirect(url_for("index"))
        else:
            flash("Invalid username or password.", "error")
            
    return render_template("login.html")

@app.route("/register", methods=["POST"])
def register():
    username = request.form.get("username", "").strip()
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    password = request.form.get("password", "")
    
    if not username or not password or not name or not email:
        flash("All fields are required.", "error")
        return redirect(url_for("login"))
        
    if username in users:
        flash("Username already exists.", "error")
        return redirect(url_for("login"))
        
    users[username] = {
        "name": name,
        "email": email,
        "password": password
    }
    
    # Auto login after register
    session["username"] = username
    session["name"] = name
    return redirect(url_for("index"))

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

@app.route("/profile")
def profile():
    if "username" not in session:
        flash("Please log in to view your profile.", "error")
        return redirect(url_for("login"))
        
    user_info = users.get(session["username"])
    if not user_info:
        session.clear()
        return redirect(url_for("login"))
        
    return render_template("profile.html", user=user_info, username=session["username"])

@app.route("/changelog")
def changelog():
    total_ideas = len(features)
    total_votes = sum(f["votes"] for f in features)
    top_idea = max(features, key=lambda x: x["votes"]) if features else None
    avg_votes = round(total_votes / total_ideas, 1) if total_ideas > 0 else 0
    
    # Sort features by ID descending to pretend it's a 'latest changes' list
    recent_features = sorted(features, key=lambda x: x["id"], reverse=True)[:5]
    
    return render_template("changelog.html", 
                           total_ideas=total_ideas, 
                           total_votes=total_votes, 
                           top_idea=top_idea, 
                           avg_votes=avg_votes,
                           recent_features=recent_features)

@app.route("/api/features", methods=["GET"])
def get_features():
    sort_by = request.args.get('sort', 'most_voted')
    
    if sort_by == 'newest_first':
        sorted_features = sorted(features, key=lambda x: x["id"], reverse=True)
    elif sort_by == 'in_review':
        # Mock 'in_review' by showing least voted features
        sorted_features = sorted(features, key=lambda x: x["votes"])
    else:
        # Default to Most Voted
        sorted_features = sorted(features, key=lambda x: x["votes"], reverse=True)
        
    return jsonify(sorted_features)

@app.route("/api/features", methods=["POST"])
def add_feature():
    global next_id
    data = request.get_json()
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    
    if not title:
        return jsonify({"error": "Title is required"}), 400
        
    new_feature = {"id": next_id, "title": title, "description": description, "votes": 1}
    features.append(new_feature)
    next_id += 1
    
    return jsonify(new_feature), 201

@app.route("/api/features/<int:feature_id>/vote", methods=["POST"])
def vote_feature(feature_id):
    for f in features:
        if f["id"] == feature_id:
            f["votes"] += 1
            return jsonify({"success": True, "feature": f})
    
    return jsonify({"error": "Feature not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)
